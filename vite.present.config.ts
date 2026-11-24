import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {deckVersion} from './tools/deck-version.mjs';
import presenterPages from './tools/presenter-plugin.mjs';

// The present build plays prerendered video, so it never bundles Canvas Commons.
export default defineConfig({
  define: {__DECK_VERSION__: JSON.stringify(deckVersion())},
  resolve: {alias: {'#backend': fileURLToPath(new URL('./src/presenter/backend-video.ts', import.meta.url))}},
  build: {
    outDir: 'dist-present',
    rollupOptions: {input: {audience: 'audience.html', presenter: 'presenter.html'}},
  },
  preview: {port: Number(process.env.PORT ?? 9001), strictPort: true},
  plugins: [presenterPages()],
});
