import {Presenter, PlaybackState} from '@canvas-commons/core';
import project from './runtime-project';
import {loadBrandFonts} from '../scenes/brand';

// Driven by tools/prerender.mjs: steps the deck frame by frame instead of in real time.

interface Internals {
  reloadScenes(settings: unknown): Promise<void>;
}

interface Bindings {
  saveFrame(segment: number, frame: number, base64: string): Promise<void>;
}

const presenter = new Presenter(project);
const playback = presenter.playback;
const canvas = presenter.stage.finalBuffer;
const settings = {...project.meta.getFullRenderingSettings(), name: project.name, slide: null as string | null};
const bindings = window as unknown as Bindings;

const base64 = (url: string) => url.slice(url.indexOf(',') + 1);

async function renderFrame() {
  await presenter.stage.render(playback.currentScene, playback.previousScene);
}

async function init() {
  await loadBrandFonts();
  presenter.stage.configure(settings);
  playback.fps = settings.fps;
  await (presenter as unknown as Internals).reloadScenes(settings);
  playback.state = PlaybackState.Playing;
  await playback.recalculate();
  playback.state = PlaybackState.Presenting;
  await playback.reset();
  return {
    fps: settings.fps,
    width: settings.size.x,
    height: settings.size.y,
    slides: playback.slides.map(slide => ({id: slide.id, name: slide.name})),
  };
}

/** Renders the animation that arrives at slide `index`; returns the frame count. */
async function renderSegment(index: number): Promise<number> {
  playback.state = PlaybackState.Playing;
  if (index === 0) {
    await playback.reset();
  } else {
    await playback.goTo(playback.slides[index - 1].id);
  }
  playback.state = PlaybackState.Presenting;
  if (index > 0) playback.currentScene.slides.resume();

  let frame = 0;
  await renderFrame();
  await bindings.saveFrame(index, frame++, base64(canvas.toDataURL('image/png')));
  for (;;) {
    await playback.progress();
    await renderFrame();
    await bindings.saveFrame(index, frame++, base64(canvas.toDataURL('image/png')));
    if (playback.currentScene.slides.isWaiting() || playback.finished) break;
  }

  return frame;
}

(window as unknown as {prerender: unknown}).prerender = {init, renderSegment};
document.title = 'ready';
