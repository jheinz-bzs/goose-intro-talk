import type {Deck, Role} from './deck-types';
import {LiveDeck} from './live-deck';
import {renderThumbnails} from './thumbnails';

/** Selected through the "#backend" alias; the present build swaps in backend-video.ts. */
export const createDeck = (role: Role, resolutionScale?: number): Deck => new LiveDeck(role, resolutionScale);

export const previews = {
  supported: true,
  render: renderThumbnails,
  initial: async (): Promise<Record<string, string>> => ({}),
};
