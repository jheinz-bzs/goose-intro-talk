export interface DeckInfo {
  currentSlideId: string | null;
  nextSlideId: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  isWaiting: boolean;
  count: number;
  index: number | null;
}

export interface SlideRef {
  id: string;
  name: string;
  sceneName: string;
}

export type Role = 'presenter' | 'audience';

/** What the pages need from a deck; implemented by live rendering and by prerendered video. */
export interface Deck {
  readonly info: DeckInfo;
  readonly slides: SlideRef[];
  onInfo(handler: (info: DeckInfo) => void): void;
  onSlides(handler: (slides: SlideRef[]) => void): void;
  /** Puts the slide view inside the given element. */
  mount(parent: HTMLElement): void;
  /** onReady fires once the first slide is showing and waiting. */
  start(onReady: () => void, onError: (message: string) => void): void;
  next(): void;
  previous(): void;
  goto(id: string): void;
}
