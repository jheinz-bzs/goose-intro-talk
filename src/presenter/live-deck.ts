import type {Slide} from '@canvas-commons/core';
import {DeckBase} from './deck-base';
import type {DeckInfo, Role, SlideRef} from './deck-types';
import {IdlePresenter} from './idle-presenter';
import project from './runtime-project';

const toRef = (slide: Slide): SlideRef => ({id: slide.id, name: slide.name, sceneName: slide.scene.name});

/** Renders the scenes live with Canvas Commons' Presenter. */
export class LiveDeck extends DeckBase {
  private readonly presenter = new IdlePresenter(project);

  constructor(
    role: Role,
    private readonly resolutionScale?: number,
  ) {
    super(role);
  }

  get info(): DeckInfo {
    return this.presenter.onInfoChanged.current;
  }

  get slides(): SlideRef[] {
    return this.presenter.onSlidesChanged.current.map(toRef);
  }

  onInfo(handler: (info: DeckInfo) => void) {
    this.presenter.onInfoChanged.subscribe(handler);
  }

  onSlides(handler: (slides: SlideRef[]) => void) {
    this.presenter.onSlidesChanged.subscribe(slides => handler(slides.map(toRef)));
  }

  mount(parent: HTMLElement) {
    const view = document.createElement('div');
    view.className = 'deck-view';
    view.append(this.presenter.stage.finalBuffer);
    parent.append(view);
  }

  protected begin(slide: string | null, onReady: () => void, onError: (message: string) => void) {
    project.logger.onLogged.subscribe(payload => {
      if (payload.level === 'error') onError(payload.message);
    });
    let ready = false;
    this.presenter.onInfoChanged.subscribe(info => {
      if (ready || !info.isWaiting) return;
      ready = true;
      onReady();
    });
    this.presenter
      .present({
        ...project.meta.getFullRenderingSettings(),
        ...(this.resolutionScale ? {resolutionScale: this.resolutionScale} : {}),
        name: project.name,
        slide,
      })
      .catch(error => onError(String(error)));
  }

  protected resume() {
    this.presenter.resume();
  }

  protected seekNext() {
    this.presenter.requestNextSlide();
  }

  protected seekPrevious() {
    this.presenter.requestPreviousSlide();
  }

  protected seekTo(id: string) {
    this.presenter.requestSlide(id);
  }
}
