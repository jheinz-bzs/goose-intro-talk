import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import canvasCommons from '@canvas-commons/vite-plugin';
import webcodecs from '@canvas-commons/webcodecs';
import {deckVersion} from './tools/deck-version.mjs';
import presenterPages from './tools/presenter-plugin.mjs';

export default defineConfig({
  resolve: {alias: {'#backend': fileURLToPath(new URL('./src/presenter/backend-live.ts', import.meta.url))}},
  define: {__DECK_VERSION__: JSON.stringify(deckVersion())},
  server: {port: 9001, strictPort: true},
  plugins: [canvasCommons(), webcodecs(), presenterPages()],
});
