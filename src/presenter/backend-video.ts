import type {Deck, Role} from './deck-types';
import {loadManifest} from './manifest';
import type {ThumbnailOptions} from './thumbnails';
import {VideoDeck} from './video-deck';

export const createDeck = (role: Role): Deck => new VideoDeck(role);

// Thumbnails are prerendered, so nothing is rendered at runtime.
export const previews = {
  supported: false,
  render: async (_options: ThumbnailOptions): Promise<void> => {},
  initial: async (): Promise<Record<string, string>> => {
    const manifest = await loadManifest();
    return Object.fromEntries(manifest.slides.map(slide => [slide.id, `/prerender/${slide.thumb}`]));
  },
};
