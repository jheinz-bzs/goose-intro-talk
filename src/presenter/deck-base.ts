import type {Deck, DeckInfo, Role, SlideRef} from './deck-types';
import {notesFile} from './notes';
import {storageKey} from './storage';

type Message =
  | {type: 'next'}
  | {type: 'prev'}
  | {type: 'goto'; id: string}
  | {type: 'state'; id: string}
  | {type: 'hello'};

const HEARTBEAT_MS = 1500;
const SYNC_QUIET_MS = 1500;

/**
 * Cross-window sync shared by every deck backend. The presenter window is the
 * source of truth: it persists its position and broadcasts it; every window
 * applies navigation commands itself so animations play everywhere.
 */
export abstract class DeckBase implements Deck {
  private readonly channel = new BroadcastChannel(`canvas-presenter:${notesFile.key}`);
  private lastNavigation = 0;

  constructor(private readonly role: Role) {
    this.channel.onmessage = event => this.receive(event.data as Message);
  }

  abstract get info(): DeckInfo;
  abstract get slides(): SlideRef[];
  abstract onInfo(handler: (info: DeckInfo) => void): void;
  abstract onSlides(handler: (slides: SlideRef[]) => void): void;
  abstract mount(parent: HTMLElement): void;
  /** Starts at `slide` (or the beginning when null or unknown). */
  protected abstract begin(slide: string | null, onReady: () => void, onError: (message: string) => void): void;
  /** Plays on from a waiting slide to the next one. */
  protected abstract resume(): void;
  protected abstract seekNext(): void;
  protected abstract seekPrevious(): void;
  protected abstract seekTo(id: string): void;

  start(onReady: () => void, onError: (message: string) => void) {
    this.begin(localStorage.getItem(storageKey('slide')), onReady, onError);

    if (this.role === 'presenter') {
      this.onInfo(info => this.publish(info));
      setInterval(() => this.publish(this.info), HEARTBEAT_MS);
    } else {
      this.channel.postMessage({type: 'hello'} satisfies Message);
    }
  }

  next() {
    const info = this.info;
    if (info.currentSlideId !== null && !info.hasNext) return;
    this.dispatch({type: 'next'});
  }

  previous() {
    if (!this.info.hasPrevious) return;
    this.dispatch({type: 'prev'});
  }

  goto(id: string) {
    this.dispatch({type: 'goto', id});
  }

  private dispatch(message: Message) {
    this.channel.postMessage(message);
    this.apply(message);
  }

  private apply(message: Message) {
    this.lastNavigation = Date.now();
    if (message.type === 'next') {
      // Resuming plays the animation up to the next slide; seeking would jump straight there.
      if (this.info.isWaiting) this.resume();
      else this.seekNext();
    } else if (message.type === 'prev') this.seekPrevious();
    else if (message.type === 'goto') this.seekTo(message.id);
  }

  private publish(info: DeckInfo) {
    if (!info.currentSlideId || !info.isWaiting) return;
    localStorage.setItem(storageKey('slide'), info.currentSlideId);
    this.channel.postMessage({type: 'state', id: info.currentSlideId} satisfies Message);
  }

  private receive(message: Message) {
    if (message.type === 'hello') {
      if (this.role === 'presenter') this.publish(this.info);
    } else if (message.type === 'state') {
      if (this.role === 'audience') this.follow(message.id);
    } else {
      this.apply(message);
    }
  }

  // Correct drift (a missed command, a reload) without fighting an animation in flight.
  private follow(id: string) {
    const info = this.info;
    const quiet = Date.now() - this.lastNavigation > SYNC_QUIET_MS;
    if (quiet && info.isWaiting && info.currentSlideId !== id) {
      this.lastNavigation = Date.now();
      this.seekTo(id);
    }
  }
}
