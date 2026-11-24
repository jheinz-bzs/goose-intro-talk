import {Presenter, type Project} from '@canvas-commons/core';

interface Internals {
  loop(): Promise<void>;
  updateInfo(): void;
  request(): void;
  requestedSlide: unknown;
  requestedResume: boolean;
}

/**
 * Presenter that stops re-rendering while it waits on a slide. Core's loop
 * re-renders every frame even when nothing changes, which is costly with
 * several canvases on screen.
 */
export class IdlePresenter extends Presenter {
  constructor(project: Project) {
    super(project);
    // Wraps the private Presenter.loop of @canvas-commons/core 0.4.0; revisit on upgrade.
    const internals = this as unknown as Internals;
    const originalLoop = internals.loop.bind(this);
    let rendered = false; // false until the first real render, so a deck that starts out waiting still draws a frame

    internals.loop = async () => {
      const waiting = this.settled();
      const idle = internals.requestedSlide === null && !internals.requestedResume;
      if (rendered && waiting && idle) {
        internals.updateInfo();
        internals.request();
        return;
      }
      await originalLoop();
      rendered = this.settled();
    };
  }

  private settled(): boolean {
    return this.playback.currentScene.slides.isWaiting() || this.playback.finished;
  }
}
