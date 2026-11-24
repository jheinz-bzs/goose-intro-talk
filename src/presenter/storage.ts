import {notesFile} from './notes';

export const storageKey = (suffix: string) => `canvas-presenter:${notesFile.key}:${suffix}`;
