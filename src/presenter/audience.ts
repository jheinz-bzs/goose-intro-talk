import {createDeck} from '#backend';
import {bindNavigationKeys} from './nav-keys';
import {h, clear} from './dom';
import {notesFor, warnUnknownIds} from './notes';

const LINK_VISIBLE_MS = 4000;

const style = document.createElement('style');
style.textContent = `
  html, body { margin: 0; height: 100%; background: #152B57; overflow: hidden; }
  .deck-view { position: fixed; inset: 0; background: #152B57; }
  .deck-view canvas, .deck-view img, .deck-view video { position: absolute; inset: 0; width: 100%;
    height: 100%; object-fit: contain; }
  .links { position: fixed; right: 24px; bottom: 24px; display: flex; gap: 12px; opacity: 0;
    transition: opacity 0.25s; pointer-events: none; }
  .links.visible { opacity: 1; pointer-events: auto; }
  .links a { font: 600 20px system-ui, sans-serif; color: #EAF1F5; background: rgba(18, 41, 58, 0.92);
    border: 1px solid #24465C; border-radius: 8px; padding: 10px 18px; text-decoration: none; }
  .links a:hover { background: #00C4E9; color: #00222E; }
`;
document.head.append(style);

const deck = createDeck('audience');
const links = h('div', {class: 'links'});
deck.mount(document.body);
document.body.append(links);

let hideTimer: number | undefined;
let shownFor: string | null = null;

function renderLinks() {
  const id = deck.info.currentSlideId;
  if (id === shownFor) return;
  shownFor = id;
  clear(links);
  const link = notesFor(id).link;
  if (link) links.append(h('a', {href: link[1], target: '_blank', rel: 'noopener'}, link[0]));
}

deck.onInfo(renderLinks);
deck.onSlides(slides => {
  if (slides.length) warnUnknownIds(slides.map(slide => slide.id));
});

window.addEventListener('mousemove', () => {
  if (!links.childElementCount) return;
  links.classList.add('visible');
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => links.classList.remove('visible'), LINK_VISIBLE_MS);
});

bindNavigationKeys(deck, event => {
  if (event.key === ' ') {
    deck.next();
    return true;
  }
  if (event.key === 'f' || event.key === 'F') {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
    return true;
  }
  return false;
});

deck.start(
  () => window.canvasPresenterBoot?.ready(),
  message => window.canvasPresenterBoot?.fail(message),
);
