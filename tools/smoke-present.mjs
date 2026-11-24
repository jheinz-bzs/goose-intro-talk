import {chromium} from 'playwright';

// Usage: node tools/smoke-present.mjs http://localhost:9001
const base = process.argv[2] ?? 'http://localhost:9001';
const errors = [];
const fail = message => {
  console.error('FAIL:', message);
  process.exitCode = 1;
};

const browser = await chromium.launch();
const context = await browser.newContext({viewport: {width: 1400, height: 800}});
const presenter = await context.newPage();
const audience = await context.newPage();
for (const [name, page] of [['presenter', presenter], ['audience', audience]]) {
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  page.on('console', m => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`));
}

await presenter.goto(`${base}/presenter`);
await audience.goto(`${base}/audience`);
for (const page of [presenter, audience]) {
  await page.waitForFunction(() => !document.getElementById('boot'), null, {timeout: 20000});
}

// The slide on screen is the visible <video>; the placeholder <img> must stay hidden.
const view = page =>
  page.evaluate(() => {
    const visible = [...document.querySelectorAll('.deck-view video')].find(v => getComputedStyle(v).opacity === '1');
    const img = document.querySelector('.deck-view img');
    return {
      clip: visible ? visible.currentSrc.split('/').pop() : null,
      time: visible?.currentTime ?? null,
      duration: visible?.duration ?? null,
      paused: visible?.paused ?? null,
      imgOpacity: img ? getComputedStyle(img).opacity : null,
    };
  });
const settled = (v, label) => {
  if (!v.clip) fail(`${label}: no visible video`);
  else if (v.duration - v.time > 0.1) fail(`${label}: video not at its last frame (${v.time}/${v.duration})`);
  if (v.imgOpacity !== '0') fail(`${label}: placeholder image visible (${v.imgOpacity})`);
};

await presenter.waitForTimeout(3500);
const first = {presenter: await view(presenter), audience: await view(audience)};
console.log('first (clip 0 plays on a fresh start)', first);
settled(first.presenter, 'presenter first');
settled(first.audience, 'audience first');

const flicker = [];
await presenter.keyboard.press('ArrowRight');
for (let i = 0; i < 12; i++) {
  await presenter.waitForTimeout(100);
  const v = await view(presenter);
  flicker.push(v.clip ? `${v.clip}@${v.time.toFixed(2)}` : 'NONE');
}
console.log('presenter during Next', flicker.join(' '));
if (flicker.includes('NONE')) fail('presenter showed no visible video during Next');
const mid = await view(audience);
console.log('audience after Next', mid);
await presenter.waitForTimeout(3200);
const after = {presenter: await view(presenter), audience: await view(audience)};
console.log('after', after);
settled(after.presenter, 'presenter after Next');
settled(after.audience, 'audience after Next');
if (after.presenter.clip === first.presenter.clip || after.presenter.clip !== after.audience.clip) fail('slides did not advance together');

// Rapid Next presses
await audience.keyboard.press('ArrowRight');
await audience.keyboard.press('ArrowRight');
await presenter.waitForTimeout(6000);
const rapid = {presenter: await view(presenter), audience: await view(audience)};
console.log('after two rapid Nexts', rapid);
settled(rapid.presenter, 'presenter rapid');
settled(rapid.audience, 'audience rapid');
if (rapid.presenter.clip !== rapid.audience.clip) fail('rapid Next desynced');

await presenter.keyboard.press('ArrowLeft');
await presenter.waitForTimeout(800);
const back = {presenter: await view(presenter), audience: await view(audience)};
console.log('after Previous', back);
settled(back.presenter, 'presenter previous');
if (back.presenter.clip !== back.audience.clip) fail('Previous desynced');

await audience.reload();
await audience.waitForFunction(() => !document.getElementById('boot'), null, {timeout: 20000});
await audience.waitForTimeout(500);
const rejoined = await view(audience);
console.log('audience reloaded', rejoined);
settled(rejoined, 'audience reload');
if (rejoined.clip !== back.presenter.clip) fail('reloaded audience did not rejoin');

console.log('header:', (await presenter.locator('header').innerText()).replace(/\n+/g, ' | '));
if (errors.length) fail(`page errors: ${errors.join('; ')}`);
await browser.close();
console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
