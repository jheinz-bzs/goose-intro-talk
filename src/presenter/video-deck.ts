import {DeckBase} from './deck-base';
import type {DeckInfo, Role, SlideRef} from './deck-types';
import {loadManifest, PRERENDER_DIR, type Manifest} from './manifest';

const EMPTY: DeckInfo = {
  currentSlideId: null,
  nextSlideId: null,
  hasNext: false,
  hasPrevious: false,
  isWaiting: false,
  count: 0,
  index: null,
};

/** Plays clips prerendered by tools/prerender.mjs; no Canvas Commons code runs. */
const SEEK_TIMEOUT_MS = 2000;
const FRAME_TIMEOUT_MS = 600;

const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

function whenReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    video.addEventListener('loadeddata', () => resolve(), {once: true});
    video.addEventListener('error', () => reject(new Error(`Could not load ${video.currentSrc}`)), {once: true});
  });
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, SEEK_TIMEOUT_MS);
    video.addEventListener(
      'seeked',
      () => {
        clearTimeout(timer);
        resolve();
      },
      {once: true},
    );
    video.currentTime = time;
  });
}

/**
 * Plays clips prerendered by tools/prerender.mjs; no Canvas Commons code runs.
 *
 * Two stacked videos are double-buffered. A slide at rest is the last frame of
 * the clip that arrives at it, so a clip's end and the next clip's first frame
 * are the same picture and nothing is ever swapped for a still image (the
 * still only covers the very first load).
 */
export class VideoDeck extends DeckBase {
  private manifest: Manifest | null = null;
  private index = -1;
  private playing = false;
  private playTarget: number | null = null;
  private front = 1;
  private revealed = false;
  private operation = 0;
  private readonly chains = new Map<HTMLVideoElement, Promise<unknown>>();
  private readonly infoHandlers: ((info: DeckInfo) => void)[] = [];
  private readonly slideHandlers: ((slides: SlideRef[]) => void)[] = [];
  private readonly view = document.createElement('div');
  private readonly placeholder = document.createElement('img');
  private readonly videos = [document.createElement('video'), document.createElement('video')];
  private onReady: (() => void) | null = null;
  private onError: (message: string) => void = () => {};

  constructor(role: Role) {
    super(role);
    this.view.className = 'deck-view';
    this.view.append(this.placeholder);
    for (const video of this.videos) {
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.style.opacity = '0';
      this.view.append(video);
    }
  }

  get info(): DeckInfo {
    const manifest = this.manifest;
    if (!manifest) return EMPTY;
    const count = manifest.slides.length;
    return {
      currentSlideId: manifest.slides[this.index]?.id ?? null,
      nextSlideId: manifest.slides[this.index + 1]?.id ?? null,
      hasNext: this.index < count - 1,
      hasPrevious: this.index > 0,
      isWaiting: !this.playing,
      count,
      index: this.index,
    };
  }

  get slides(): SlideRef[] {
    return (this.manifest?.slides ?? []).map(slide => ({
      id: slide.id,
      name: slide.name,
      sceneName: slide.id.split(':')[0],
    }));
  }

  onInfo(handler: (info: DeckInfo) => void) {
    this.infoHandlers.push(handler);
    handler(this.info);
  }

  onSlides(handler: (slides: SlideRef[]) => void) {
    this.slideHandlers.push(handler);
    handler(this.slides);
  }

  mount(parent: HTMLElement) {
    parent.append(this.view);
  }

  protected begin(slide: string | null, onReady: () => void, onError: (message: string) => void) {
    this.onReady = onReady;
    this.onError = onError;
    loadManifest()
      .then(manifest => {
        this.manifest = manifest;
        for (const handler of this.slideHandlers) handler(this.slides);
        const saved = manifest.slides.findIndex(candidate => candidate.id === slide);
        if (saved >= 0) {
          this.placeholder.src = PRERENDER_DIR + manifest.slides[saved].still;
          this.placeholder.style.opacity = '1';
          void this.show(saved);
        } else {
          void this.play(0);
        }
      })
      .catch(error => onError(String(error)));
  }

  protected resume() {
    if (this.index + 1 < this.count()) void this.play(this.index + 1);
  }

  // A second Next during an animation finishes it at once, then starts the following one.
  protected seekNext() {
    const target = this.playTarget;
    if (target === null) return;
    const operation = ++this.operation;
    this.detach();
    const video = this.videoFor(target);
    video.pause();
    void this.prepare(video, target, 'end').then(() => {
      if (operation !== this.operation) return;
      this.reveal(video);
      this.land(target);
      this.resume();
    });
  }

  protected seekPrevious() {
    if (this.index > 0) void this.show(this.index - 1);
  }

  protected seekTo(id: string) {
    const target = this.manifest?.slides.findIndex(slide => slide.id === id) ?? -1;
    if (target >= 0) void this.show(target);
  }

  private count(): number {
    return this.manifest?.slides.length ?? 0;
  }

  private url(target: number): string | null {
    const slide = this.manifest?.slides[target];
    return slide ? PRERENDER_DIR + slide.clip : null;
  }

  private videoFor(target: number): HTMLVideoElement {
    const url = this.url(target);
    return this.videos.find(video => video.dataset.clip === url) ?? this.videos[1 - this.front];
  }

  private detach() {
    for (const video of this.videos) video.onended = null;
  }

  // Calls for one element are serialized so a background preload can never clobber a later request.
  private prepare(video: HTMLVideoElement, target: number, at: 'start' | 'end'): Promise<void> {
    const run = (this.chains.get(video) ?? Promise.resolve()).catch(() => {}).then(async () => {
      const url = this.url(target);
      if (!url) return;
      if (video.dataset.clip !== url) {
        video.dataset.clip = url;
        video.src = url;
        video.load();
      }
      await whenReady(video);
      const frame = 1 / (this.manifest?.fps ?? 30);
      const time = at === 'end' ? Math.max(0, video.duration - frame / 2) : 0;
      if (Math.abs(video.currentTime - time) > 1e-3) await seek(video, time);
    });
    this.chains.set(video, run);
    return run;
  }

  private presented(video: HTMLVideoElement): Promise<void> {
    if (video.paused || !('requestVideoFrameCallback' in video)) return nextPaint();
    return new Promise(resolve => {
      const timer = setTimeout(resolve, FRAME_TIMEOUT_MS);
      video.requestVideoFrameCallback(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private preloadNext() {
    const next = this.index + 1;
    if (next < this.count()) this.prepare(this.videos[1 - this.front], next, 'start').catch(() => {});
  }

  // Opacity, not display, so the browser keeps decoded frames for the hidden element.
  private reveal(video: HTMLVideoElement) {
    if (this.videos[this.front] !== video) {
      const old = this.videos[this.front];
      video.style.zIndex = '2';
      video.style.opacity = '1';
      old.style.zIndex = '1';
      old.style.opacity = '0';
      old.pause();
      this.front = this.videos.indexOf(video);
    } else {
      video.style.opacity = '1';
    }
    if (!this.revealed) {
      this.revealed = true;
      this.placeholder.style.opacity = '0';
      const ready = this.onReady;
      this.onReady = null;
      ready?.();
    }
  }

  private land(target: number) {
    this.index = target;
    this.playing = false;
    this.playTarget = null;
    this.emit();
    this.preloadNext();
  }

  private async play(target: number) {
    const operation = ++this.operation;
    this.detach();
    const video = this.videos[1 - this.front];
    try {
      await this.prepare(video, target, 'start');
      if (operation !== this.operation) return;
      this.playing = true;
      this.playTarget = target;
      this.emit();
      video.onended = () => {
        if (operation !== this.operation) return;
        if (this.videos[this.front] !== video) this.reveal(video);
        this.land(target);
      };
      const frame = this.presented(video);
      await video.play();
      await frame;
      if (operation !== this.operation) return;
      if (this.videos[this.front] !== video) this.reveal(video);
    } catch (error) {
      if (operation === this.operation) {
        this.onError(String(error));
        void this.show(target);
      }
    }
  }

  private async show(target: number) {
    const operation = ++this.operation;
    this.detach();
    const video = this.videos[1 - this.front];
    try {
      await this.prepare(video, target, 'end');
      await this.presented(video);
    } catch (error) {
      this.onError(String(error));
      return;
    }
    if (operation !== this.operation) return;
    this.reveal(video);
    this.land(target);
  }

  private emit() {
    const info = this.info;
    for (const handler of this.infoHandlers) handler(info);
  }
}
