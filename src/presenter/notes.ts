import rawNotes from '../notes.json';

export type ItemKind = 'SAY' | 'ASK' | 'LEAVE' | 'SHOW' | 'CONFIRM' | 'FIX' | 'WALK';

/** [kind, text, optional id chip, optional walk-through steps] */
export type Item = [ItemKind, string, (string | null)?, string[]?];

/** [label, detail, optional url, optional url label] */
export type Tip = [string, string, string?, string?];

export interface SlideNotes {
  s?: string;
  e?: string;
  link?: [string, string];
  items?: Item[];
  tips?: Tip[];
}

export interface NotesFile {
  key: string;
  title: string;
  session_title: string;
  notes: Record<string, SlideNotes>;
  /** Item numbers are 1-based, as strings. */
  why: Record<string, Record<string, string>>;
}

export const notesFile = rawNotes as unknown as NotesFile;

export const KIND_LABELS: Record<ItemKind, string> = {
  SAY: 'Say',
  ASK: 'Ask',
  LEAVE: 'Leave with',
  SHOW: 'Show',
  CONFIRM: 'Confirm',
  FIX: 'Pain point',
  WALK: 'Walk through',
};

export function notesFor(slideId: string | null): SlideNotes {
  return (slideId && notesFile.notes[slideId]) || {};
}

export function warnUnknownIds(slideIds: string[]) {
  const known = new Set(slideIds);
  const ids = [...Object.keys(notesFile.notes), ...Object.keys(notesFile.why ?? {})];
  for (const id of new Set(ids)) {
    if (!known.has(id)) console.warn(`notes.json references unknown slide id "${id}"`);
  }
}

export function slideTitle(name: string): string {
  const text = name.replace(/[-_]+/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
