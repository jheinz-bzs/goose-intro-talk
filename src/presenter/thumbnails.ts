import type {PresenterInfo} from '@canvas-commons/core';
import {IdlePresenter} from './idle-presenter';
import project from './runtime-project';

const SCALE = 0.25;
const JPEG_QUALITY = 0.7;
const SLIDE_TIMEOUT_MS = 5000;
const START_TIMEOUT_MS = 15000;
const PAUSE_POLL_MS = 200;
const FALLBACK_IDLE_MS = 50;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const nextIdle = () =>
  new Promise<void>(resolve => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), {timeout: 500});
    else setTimeout(resolve, FALLBACK_IDLE_MS);
  });

export interface ThumbnailOptions {
  /** Slide ids that still need a thumbnail, in deck order. */
  ids: string[];
  onThumbnail: (id: string, url: string) => void;
  /** While true (the main deck is animating) no work is done. */
  paused: () => boolean;
  cancelled: () => boolean;
}

/**
 * Seeks a hidden low-resolution presenter through the given slides, one slide
 * per idle callback, so it never competes with the live deck.
 */
export async function renderThumbnails({ids, onThumbnail, paused, cancelled}: ThumbnailOptions): Promise<void> {
  if (!ids.length) return;
  const step = async () => {
    await nextIdle();
    while (paused() && !cancelled()) await sleep(PAUSE_POLL_MS);
  };

  await step();
  if (cancelled()) return;
  const presenter = new IdlePresenter(project);
  void presenter.present({
    ...project.meta.getFullRenderingSettings(),
    resolutionScale: SCALE,
    name: project.name,
    slide: null,
  });

  const waitFor = (ready: (info: PresenterInfo) => boolean, timeoutMs: number) =>
    new Promise<boolean>(resolve => {
      let unsubscribe: (() => void) | null = null;
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        unsubscribe?.();
        resolve(ok);
      };
      const timeout = window.setTimeout(() => finish(false), timeoutMs);
      // subscribe() invokes the handler synchronously, before unsubscribe is assigned.
      unsubscribe = presenter.onInfoChanged.subscribe(info => {
        if (ready(info)) finish(true);
      });
      if (settled) unsubscribe?.();
    });

  try {
    if (!(await waitFor(info => info.count > 0 && info.isWaiting, START_TIMEOUT_MS))) return;
    for (const id of ids) {
      await step();
      if (cancelled()) break;
      const arrived = waitFor(info => info.isWaiting && info.currentSlideId === id, SLIDE_TIMEOUT_MS);
      presenter.requestSlide(id);
      if (!(await arrived)) continue;
      onThumbnail(id, presenter.stage.finalBuffer.toDataURL('image/jpeg', JPEG_QUALITY));
    }
  } finally {
    presenter.abort();
  }
}
