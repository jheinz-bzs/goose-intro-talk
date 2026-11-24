import {chromium} from 'playwright';

// Usage: node tools/layout-shift.mjs http://localhost:9001
// Reports layout-shift entries and any region that moved or resized across navigations.
const base = process.argv[2] ?? 'http://localhost:9001';
const REGIONS = {
  'header stat 1': 'header > div:nth-of-type(1)',
  'header stat 2': 'header > div:nth-of-type(2)',
  'header stat 3': 'header > div:nth-of-type(3)',
  'header timer': 'header > .timer-controls',
  slides: '.slides',
  'current box': '.stage > .screen',
  'next box': '.next',
  tips: '.below > .panel',
  toolbar: '.toolbar',
  checklist: '.checklist',
  notes: 'textarea',
};

const browser = await chromium.launch();
let worst = 0;
for (const [width, height] of [[1400, 800], [1100, 700], [800, 700]]) {
  const page = await browser.newPage({viewport: {width, height}});
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        window.__shifts.push({
          value: entry.value,
          at: Math.round(entry.startTime),
          sources: entry.sources.map(s => (s.node?.className || s.node?.nodeName || '?') + '').slice(0, 4),
        });
      }
    }).observe({type: 'layout-shift', buffered: true});
  });
  await page.goto(`${base}/presenter`);
  await page.waitForFunction(() => !document.getElementById('boot'), null, {timeout: 20000});
  await page.waitForTimeout(3500);

  const rects = () =>
    page.evaluate(regions => {
      const out = {};
      for (const [name, selector] of Object.entries(regions)) {
        const el = document.querySelector(selector);
        const r = el?.getBoundingClientRect();
        out[name] = r ? [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10) : null;
      }
      return out;
    }, REGIONS);

  const actions = [
    ['Next', () => page.keyboard.press('ArrowRight')],
    ['Next', () => page.keyboard.press('ArrowRight')],
    ['Previous', () => page.keyboard.press('ArrowLeft')],
    ['Space x2', async () => { await page.keyboard.press(' '); await page.keyboard.press(' '); }],
    ['Jump', () => page.locator('.slide-row').nth(6).click()],
    ['Jump back', () => page.locator('.slide-row').nth(0).click()],
  ];
  for (const [name, run] of actions) {
    const before = await rects();
    await run();
    await page.waitForTimeout(2500);
    const after = await rects();
    const moved = Object.keys(before).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
    console.log(`${width}x${height} ${name}: moved ${moved.length ? moved.map(k => `${k} ${before[k]} -> ${after[k]}`).join('; ') : 'none'}`);
  }
  const shifts = await page.evaluate(() => window.__shifts);
  const cls = shifts.reduce((sum, s) => sum + s.value, 0);
  worst = Math.max(worst, cls);
  console.log(`${width}x${height} CLS ${cls.toFixed(4)}`, shifts.length ? JSON.stringify(shifts) : '');
  await page.close();
}
await browser.close();
console.log(worst < 0.01 ? 'LAYOUT OK' : 'LAYOUT SHIFTS');
process.exitCode = worst < 0.01 ? 0 : 1;
