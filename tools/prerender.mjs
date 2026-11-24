import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {deckVersion} from './deck-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/prerender');
const manifestPath = path.join(outDir, 'manifest.json');
const PORT = 9014;
const CRF = '20';
const started = Date.now();

const version = deckVersion(root);
if (fs.existsSync(manifestPath)) {
  const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (existing.version === version) {
    console.log(`prerender: up to date (version ${version}); delete public/prerender to force`);
    process.exit(0);
  }
}

const ffmpeg = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const safe = id => id.replace(/[^a-z0-9-]+/gi, '_');
const mb = bytes => (bytes / 1024 / 1024).toFixed(2);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'canvas-presenter-frames-'));
fs.rmSync(outDir, {recursive: true, force: true});
for (const dir of ['clips', 'stills', 'thumbs']) fs.mkdirSync(path.join(outDir, dir), {recursive: true});

const server = await createServer({root, server: {port: PORT, strictPort: true}, logLevel: 'error'});
await server.listen();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 1280, height: 720}});
  page.on('pageerror', error => console.error('prerender page error:', error.message));
  page.on('console', message => message.type() === 'error' && console.error('prerender console:', message.text()));

  let slides = [];
  const framePath = (segment, frame) => path.join(tmp, `s${segment}`, `${String(frame).padStart(5, '0')}.png`);
  await page.exposeFunction('saveFrame', (segment, frame, data) => {
    fs.mkdirSync(path.join(tmp, `s${segment}`), {recursive: true});
    fs.writeFileSync(framePath(segment, frame), Buffer.from(data, 'base64'));
  });

  await page.goto(`http://localhost:${PORT}/render.html`);
  await page.waitForFunction(() => document.title === 'ready', null, {timeout: 120000});
  const meta = await page.evaluate(() => window.prerender.init());
  slides = meta.slides;

  const manifest = {version, fps: meta.fps, width: meta.width, height: meta.height, slides: []};
  let totalBytes = 0;
  for (let i = 0; i < slides.length; i++) {
    const frames = await page.evaluate(index => window.prerender.renderSegment(index), i);
    const name = `${String(i).padStart(2, '0')}-${safe(slides[i].id)}`;
    const clip = path.join(outDir, 'clips', `${name}.mp4`);
    execFileSync(
      ffmpeg,
      ['-y', '-loglevel', 'error', '-framerate', String(meta.fps), '-i', path.join(tmp, `s${i}`, '%05d.png'),
        '-c:v', 'libx264', '-crf', CRF, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', clip],
    );
    fs.rmSync(path.join(tmp, `s${i}`), {recursive: true, force: true});
    // Extracted from the encoded clip so the placeholder matches the video's colours.
    const extract = (dir, extra) =>
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-sseof', '-0.03', '-i', clip, ...extra, '-frames:v', '1', '-q:v', '2',
        path.join(outDir, dir, `${safe(slides[i].id)}.jpg`)]);
    extract('stills', []);
    extract('thumbs', ['-vf', 'scale=480:-2']);
    const size = fs.statSync(clip).size;
    totalBytes += size;
    console.log(`prerender: ${slides[i].id} ${frames} frames, ${mb(size)} MB`);
    manifest.slides.push({
      id: slides[i].id,
      name: slides[i].name,
      clip: `clips/${name}.mp4`,
      still: `stills/${safe(slides[i].id)}.jpg`,
      thumb: `thumbs/${safe(slides[i].id)}.jpg`,
    });
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `prerender: ${slides.length} segments, ${mb(totalBytes)} MB of clips, ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
} catch (error) {
  fs.rmSync(manifestPath, {force: true});
  console.error('prerender failed:', error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server.close();
  fs.rmSync(tmp, {recursive: true, force: true});
}
