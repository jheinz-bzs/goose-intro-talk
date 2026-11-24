/// <reference types="@canvas-commons/core/project" />

declare module '*.meta' {
  const value: import('@canvas-commons/core').MetaFile<any>;
  export default value;
}

declare module 'virtual:settings.meta' {
  const value: import('@canvas-commons/core').MetaFile<any>;
  export default value;
}

interface Window {
  canvasPresenterBoot?: {ready(): void; fail(message: string): void};
}

declare const __DECK_VERSION__: string;

interface Window {
  prerender?: unknown;
}

declare module '*.png' {
  const url: string;
  export default url;
}
