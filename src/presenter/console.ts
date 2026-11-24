import './console.css';
import {createDeck, previews} from '#backend';
import {bindNavigationKeys} from './nav-keys';
import {storageKey} from './storage';
import {clear, h} from './dom';
import {KIND_LABELS, notesFile, notesFor, slideTitle, warnUnknownIds} from './notes';

const COUNTDOWN_SECONDS = 3;
const WARN_BEFORE_END_MS = 60_000;
const DISK_SAVE_DELAY_MS = 600;
const LIVE_SCALE = 0.5;
const NOTES_URL = '/api/live-notes';

interface Options {
  why: boolean;
  auto: boolean;
  clock: boolean;
  previews: boolean;
}
interface Timer {
  elapsedMs: number;
  startedAt: number | null;
}

function load<T>(suffix: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(suffix));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const save = (suffix: string, value: unknown) =>
  localStorage.setItem(storageKey(suffix), JSON.stringify(value));

const checks = load<Record<string, number>>('checks', {});
const liveNotes = load<Record<string, string>>('notes', {});
const options: Options = {why: true, auto: false, clock: true, previews: true, ...load<Partial<Options>>('options', {})};
if (!previews.supported) options.previews = true;
const timer = load<Timer>('timer', {elapsedMs: 0, startedAt: null});

const deck = createDeck('presenter', LIVE_SCALE);
const thumbnails = new Map<string, string>();
const thumbnailKey = storageKey(`thumbs:${__DECK_VERSION__}`);
let thumbnailsDone = false;
let thumbnailJobRunning = false;

function loadCachedThumbnails() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const name = localStorage.key(i);
    if (name?.startsWith(storageKey('thumbs:')) && name !== thumbnailKey) localStorage.removeItem(name);
  }
  const cached = load<Record<string, string>>(`thumbs:${__DECK_VERSION__}`, {});
  for (const [id, url] of Object.entries(cached)) thumbnails.set(id, url);
}

function saveThumbnails() {
  try {
    localStorage.setItem(thumbnailKey, JSON.stringify(Object.fromEntries(thumbnails)));
  } catch {
    console.warn('Thumbnail cache not saved (storage quota)');
  }
}

loadCachedThumbnails();
void previews.initial().then(initial => {
  for (const [id, url] of Object.entries(initial)) thumbnails.set(id, url);
  thumbnailsDone = !previews.supported;
  renderSlides();
  syncPreview();
});

document.title = notesFile.title;

const liveScreen = h('div', {class: 'screen'});
deck.mount(liveScreen);
const clockEl = h('div', {class: 'stat w-clock'});
const elapsedEl = h('div', {class: 'stat w-elapsed'});
const positionEl = h('div', {class: 'stat w-pos'});
const slotEl = h('div', {class: 'stat slot w-slot'});
const timerToggle = h('button', {onclick: toggleTimer}, 'Start');
const slidesEl = h('aside', {class: 'slides'});
const nextHolder = h('div', {class: 'screen'});
const nextImage = h('img', {class: 'thumb hidden', alt: ''});
const nextEnd = h('div', {class: 'end hidden'}, 'End of deck');
const nextPending = h('div', {class: 'end hidden'}, 'Rendering previews…');
const nextLabelEl = h('div', {class: 'next-label'});
const nextItemsEl = h('ul', {class: 'next-items'});
const tipsEl = h('div', {class: 'panel'});
const countdownEl = h('div', {class: 'countdown hidden', onclick: cancelCountdown});
const checklistEl = h('div', {class: 'checklist'});
const notesEl = h('textarea', {placeholder: 'Notes for this slide (saved automatically)'});

function setText(el: HTMLElement, text: string) {
  if (el.textContent !== text) el.textContent = text;
}

const stat = (label: string, el: HTMLElement) => h('div', {}, el, h('small', {}, label));
const slotStat = stat('Planned slot', slotEl);
const clockStat = stat('Clock', clockEl);

function toggle(label: string, key: keyof Options) {
  const input = h('input', {type: 'checkbox'});
  input.checked = options[key];
  input.addEventListener('change', () => {
    options[key] = input.checked;
    save('options', options);
    if (key === 'clock') applyClock();
    if (key === 'previews') {
      syncPreview();
      maybeStartThumbnails();
    }
    renderChecklist();
  });
  return h('label', {}, input, label);
}

nextHolder.append(nextImage, nextEnd, nextPending);

const timerControls = h(
  'div',
  {class: 'timer-controls'},
  stat('Elapsed', elapsedEl),
  timerToggle,
  h('button', {onclick: resetTimer}, 'Reset'),
);
const app = h(
  'div',
  {id: 'app'},
  h(
    'header',
    {},
    h('h1', {}, notesFile.session_title),
    stat('Slide', positionEl),
    slotStat,
    clockStat,
    timerControls,
  ),
  h(
    'main',
    {},
    slidesEl,
    h(
      'section',
      {class: 'stage'},
      liveScreen,
      h(
        'div',
        {class: 'below'},
        h('div', {class: 'next'}, h('div', {class: 'next-label'}, 'Next'), nextHolder, nextLabelEl, nextItemsEl),
        tipsEl,
      ),
    ),
    h(
      'section',
      {class: 'right'},
      h(
        'div',
        {class: 'toolbar'},
        h('button', {onclick: () => window.open('/audience', 'canvas-presenter-audience')}, 'Open audience window'),
        h('button', {onclick: resetChecks}, 'Reset checks'),
        toggle('Why', 'why'),
        toggle('Auto-advance', 'auto'),
        toggle('Clock', 'clock'),
        previews.supported && toggle('Previews', 'previews'),
      ),
      countdownEl,
      checklistEl,
      notesEl,
    ),
  ),
);
document.body.append(app);

function currentId(): string | null {
  return deck.info.currentSlideId;
}

function checkedCount(id: string | null): number {
  return id ? (checks[id] ?? 0) : 0;
}

function setChecked(count: number) {
  const id = currentId();
  if (!id) return;
  const items = notesFor(id).items ?? [];
  const previous = checkedCount(id);
  checks[id] = Math.max(0, Math.min(items.length, count));
  save('checks', checks);
  cancelCountdown();
  renderSlides();
  renderChecklist();
  if (checks[id] > previous && checks[id] === items.length && options.auto && deck.info.hasNext) {
    startCountdown();
  }
}

function resetChecks() {
  if (!confirm('Clear all checkmarks?')) return;
  for (const id of Object.keys(checks)) delete checks[id];
  save('checks', checks);
  cancelCountdown();
  renderSlides();
  renderChecklist();
}

let countdownTimer: number | undefined;

function startCountdown() {
  let remaining = COUNTDOWN_SECONDS;
  const show = () => {
    countdownEl.textContent = `Advancing in ${remaining}... (Esc or click to cancel)`;
  };
  show();
  countdownEl.classList.remove('hidden');
  countdownTimer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      cancelCountdown();
      deck.next();
    } else {
      show();
    }
  }, 1000);
}

function cancelCountdown() {
  window.clearInterval(countdownTimer);
  countdownTimer = undefined;
  countdownEl.classList.add('hidden');
}

function renderSlides() {
  clear(slidesEl);
  const current = currentId();
  for (const slide of deck.slides) {
    const total = notesFor(slide.id).items?.length ?? 0;
    const done = checkedCount(slide.id);
    slidesEl.append(
      h(
        'div',
        {class: slide.id === current ? 'slide-row current' : 'slide-row', onclick: () => deck.goto(slide.id)},
        thumbnails.has(slide.id)
          ? h('img', {class: 'row-thumb', src: thumbnails.get(slide.id), alt: ''})
          : h('div', {class: 'row-thumb'}),
        h('span', {class: 'row-title'}, slideTitle(slide.name), h('span', {class: 'scene'}, slide.sceneName)),
        total > 0 && h('span', {class: 'count'}, `${done}/${total}`),
      ),
    );
  }
}

function renderChecklist() {
  clear(checklistEl);
  const id = currentId();
  const items = notesFor(id).items ?? [];
  if (!items.length) {
    checklistEl.append(h('div', {class: 'empty'}, 'No checklist for this slide.'));
    return;
  }
  const done = checkedCount(id);
  items.forEach(([kind, text, itemId, steps], index) => {
    const why = notesFile.why?.[id ?? '']?.[String(index + 1)];
    const classes = ['item', index < done ? 'done' : '', index === done ? 'next-up' : ''];
    checklistEl.append(
      h(
        'div',
        {class: classes.join(' ').replace(/\s+/g, ' ').trim(), onclick: () => setChecked(index + 1 === done ? index : index + 1)},
        h('div', {class: 'box'}, index < done ? '✓' : ''),
        h(
          'div',
          {},
          h(
            'div',
            {class: 'text'},
            h('span', {class: `kind kind-${kind}`}, KIND_LABELS[kind] ?? kind),
            text,
            itemId && h('span', {class: 'chip'}, itemId),
          ),
          kind === 'WALK' && steps && h('ol', {class: 'steps'}, ...steps.map(step => h('li', {}, step))),
          options.why && why && h('div', {class: 'why'}, why),
        ),
      ),
    );
  });
}

function renderTips() {
  clear(tipsEl);
  const notes = notesFor(currentId());
  tipsEl.append(h('h2', {}, 'Tips'));
  for (const [label, detail, url, urlLabel] of notes.tips ?? []) {
    tipsEl.append(
      h(
        'div',
        {class: 'tip'},
        h('b', {}, `${label}: `),
        detail,
        url && ' ',
        url && h('a', {href: url, target: '_blank', rel: 'noopener'}, urlLabel ?? url),
      ),
    );
  }
  if (!notes.tips?.length) tipsEl.append(h('div', {class: 'empty'}, 'No tips for this slide.'));
  if (notes.link) {
    tipsEl.append(h('a', {class: 'link-button', href: notes.link[1], target: '_blank', rel: 'noopener'}, notes.link[0]));
  }
}

function renderNextInfo() {
  clear(nextItemsEl);
  const nextId = deck.info.nextSlideId;
  const slide = deck.slides.find(candidate => candidate.id === nextId);
  nextLabelEl.textContent = slide ? slideTitle(slide.name) : '';
  for (const [, text] of (notesFor(nextId).items ?? []).slice(0, 2)) nextItemsEl.append(h('li', {}, text));
}

function syncPreview() {
  const nextId = deck.info.nextSlideId;
  const url = nextId && options.previews ? thumbnails.get(nextId) : undefined;
  nextHolder.classList.toggle('hidden', !options.previews);
  nextEnd.classList.toggle('hidden', nextId !== null);
  nextPending.classList.toggle('hidden', nextId === null || url !== undefined || thumbnailsDone);
  nextImage.classList.toggle('hidden', !url);
  if (url && nextImage.getAttribute('src') !== url) nextImage.src = url;
}

// Waits for the main deck to settle first so the two never recalculate at the same moment.
function maybeStartThumbnails() {
  if (!previews.supported || !options.previews || thumbnailJobRunning || !deck.info.isWaiting) return;
  const ids = deck.slides.map(slide => slide.id).filter(id => !thumbnails.has(id));
  thumbnailsDone = ids.length === 0;
  syncPreview();
  if (thumbnailsDone) return;
  thumbnailJobRunning = true;
  void previews.render({
    ids,
    onThumbnail: (id, url) => {
      thumbnails.set(id, url);
      renderSlides();
      syncPreview();
    },
    paused: () => !deck.info.isWaiting,
    cancelled: () => !options.previews,
  }).finally(() => {
    thumbnailJobRunning = false;
    thumbnailsDone = deck.slides.every(slide => thumbnails.has(slide.id));
    saveThumbnails();
    syncPreview();
  });
}

let shownSlide: string | null | undefined;

function onInfo() {
  const info = deck.info;
  setText(positionEl, `${info.index !== null && info.index >= 0 ? info.index + 1 : '-'} / ${info.count}`);
  if (info.currentSlideId !== shownSlide) {
    shownSlide = info.currentSlideId;
    cancelCountdown();
    notesEl.disabled = shownSlide === null;
    notesEl.value = (shownSlide && liveNotes[shownSlide]) || '';
    renderTips();
  }
  renderSlides();
  renderChecklist();
  renderNextInfo();
  syncPreview();
  maybeStartThumbnails();
  updateTick();
}

function parseClock(value: string | undefined): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.getTime();
}

const pad = (n: number) => String(n).padStart(2, '0');

function formatDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(total / 3600);
  const body = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return hours ? `${hours}:${body}` : body;
}

function sessionRange(): [number, number] {
  const slots = Object.values(notesFile.notes);
  const starts = slots.map(note => parseClock(note.s)).filter((t): t is number => t !== null);
  const ends = slots.map(note => parseClock(note.e)).filter((t): t is number => t !== null);
  return [Math.min(...starts), Math.max(...ends)];
}

function elapsedMs(): number {
  return timer.elapsedMs + (timer.startedAt ? Date.now() - timer.startedAt : 0);
}

function toggleTimer() {
  if (timer.startedAt) {
    timer.elapsedMs = elapsedMs();
    timer.startedAt = null;
  } else {
    timer.startedAt = Date.now();
  }
  save('timer', timer);
  updateTick();
}

function resetTimer() {
  timer.elapsedMs = 0;
  timer.startedAt = null;
  save('timer', timer);
  updateTick();
}

function updateTick() {
  const now = new Date();
  setText(clockEl, `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
  setText(elapsedEl, formatDuration(elapsedMs()));
  setText(timerToggle, timer.startedAt ? 'Pause' : 'Start');

  const notes = notesFor(currentId());
  const end = parseClock(notes.e);
  slotEl.classList.remove('warn', 'over');
  if (!notes.s || !notes.e || end === null) {
    setText(slotEl, '--');
    return;
  }
  const [sessionStart, sessionEnd] = sessionRange();
  if (now.getTime() < sessionStart || now.getTime() > sessionEnd) {
    setText(slotEl, `${notes.s}–${notes.e}`);
    return;
  }
  const remaining = end - now.getTime();
  let suffix = ` (${formatDuration(remaining)} left)`;
  if (remaining < 0) {
    slotEl.classList.add('over');
    suffix = ` (+${formatDuration(remaining)})`;
  } else if (remaining <= WARN_BEFORE_END_MS) {
    slotEl.classList.add('warn');
  }
  setText(slotEl, `${notes.s}–${notes.e}${suffix}`);
}

let diskTimer: number | undefined;

function saveNotes() {
  save('notes', liveNotes);
  window.clearTimeout(diskTimer);
  diskTimer = window.setTimeout(() => {
    fetch(NOTES_URL, {method: 'POST', body: JSON.stringify(liveNotes)}).catch(error =>
      console.warn('Could not save live notes to disk', error),
    );
  }, DISK_SAVE_DELAY_MS);
}

notesEl.addEventListener('input', () => {
  const id = currentId();
  if (!id) return;
  liveNotes[id] = notesEl.value;
  saveNotes();
});

// Local edits win over the file; the file fills in slides this browser has not seen.
async function loadDiskNotes() {
  try {
    const disk = (await (await fetch(NOTES_URL)).json()) as Record<string, string>;
    for (const [id, text] of Object.entries(disk)) liveNotes[id] ??= text;
    save('notes', liveNotes);
    const id = currentId();
    if (id && document.activeElement !== notesEl) notesEl.value = liveNotes[id] ?? '';
  } catch (error) {
    console.warn('Could not read live notes from disk', error);
  }
}

bindNavigationKeys(deck, event => {
  const target = event.target as HTMLElement;
  if (target.matches('textarea, input')) return false;
  if (event.key === ' ') {
    setChecked(checkedCount(currentId()) + 1);
    return true;
  }
  if (event.key === 'Backspace') {
    setChecked(checkedCount(currentId()) - 1);
    return true;
  }
  if (event.key === 'Escape') {
    cancelCountdown();
    return true;
  }
  return false;
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.activeElement === notesEl) notesEl.blur();
});

deck.onInfo(onInfo);
deck.onSlides(slides => {
  if (slides.length) warnUnknownIds(slides.map(slide => slide.id));
  renderSlides();
});

let tickTimer: number | undefined;
let alignTimer: number | undefined;

// Elapsed time derives from timestamps, so stopping the tick never loses it.
function applyClock() {
  window.clearInterval(tickTimer);
  window.clearTimeout(alignTimer);
  for (const el of [slotStat, clockStat, timerControls]) el.classList.toggle('hidden', !options.clock);
  if (!options.clock) return;
  updateTick();
  alignTimer = window.setTimeout(() => {
    updateTick();
    tickTimer = window.setInterval(updateTick, 1000);
  }, 1000 - (Date.now() % 1000));
}

applyClock();
void loadDiskNotes();
deck.start(
  () => window.canvasPresenterBoot?.ready(),
  message => window.canvasPresenterBoot?.fail(message),
);
