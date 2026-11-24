import type {Deck} from './deck-types';

export function bindNavigationKeys(deck: Deck, extra: (event: KeyboardEvent) => boolean = () => false) {
  window.addEventListener('keydown', event => {
    const target = event.target as HTMLElement;
    if (target.matches('textarea, input')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (extra(event)) {
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        deck.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        deck.previous();
        break;
      default:
        return;
    }
    event.preventDefault();
  });
}
