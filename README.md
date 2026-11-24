# How Goose Works (intro talk)

A 9-scene animated explainer of the Goose programming language (stack, heap, allocation, safety, benchmarks) that opens a longer talk. Built with Canvas Commons and a synced presenter console, in BizStream colors. Scenes are in `src/scenes/`, speaker notes in `src/notes.json` (key `goose-intro`).

- `/audience` is the window you share or project: the slide canvas alone, letterboxed on black.
- `/presenter` is your private console: live current slide, next-slide preview, checklist, tips, notes, timers and a slide list.
- `/` is the regular Canvas Commons editor, for authoring scenes.

## Run

```
npm install
npm start          # author: dev server with the Canvas Commons editor at /
npm run present    # give the talk: production build, fast load
```

`npm run present` does three things:

1. **Prerender** (`tools/prerender.mjs`): starts a temporary Vite server on port 9014, drives headless Chromium (Playwright) through the deck frame by frame, and encodes one H.264 MP4 per slide (the animation that plays when you advance to that slide) with ffmpeg. It also writes a full-size still and a 480 px thumbnail per slide and `manifest.json`, all into `public/prerender/` (git-ignored). It is skipped when the manifest's version hash (from `src/scenes/**`, `src/scene-list.ts`, `src/project.meta`) already matches; delete `public/prerender` to force a rerender.
2. **Build**: bundles `/audience` and `/presenter` into `dist-present/`. These bundles contain no Canvas Commons code, only the manifest, `<video>` and images, so they load fast in any browser.
3. **Preview**: serves `dist-present/` on port 9001 (`PORT=9013 npm run present` for another port).

Requirements: `ffmpeg` (Homebrew path or on `PATH`) and Playwright's Chromium (`npx playwright install chromium`, pinned to playwright 1.58.0). Rerun `npm run present` after changing scenes or notes; scene changes trigger a rerender automatically.

In present mode, Next plays the clip arriving at the next slide; Previous and clicking a slide show that slide's still instantly (no reverse animation). Animations after the last `beginSlide` are not played. `node tools/smoke-present.mjs http://localhost:9001` is a headless check of the presenter/audience sync.

`npm start` keeps rendering live with Canvas Commons (Previews toggle, slower first load) and serves the editor at `/`.

The presenter window is the source of truth. Both pages sync through BroadcastChannel; the presenter's position is stored in localStorage, so a reloaded window rejoins on the right slide. Check marks, options, timer and notes are stored per `key` from `src/notes.json`.

## Add a slide

1. In a scene under `src/scenes/`, add a boundary: `yield* beginSlide('my-slide');`
2. The slide id is `<scene file name>:<slide name>`, for example `intro:title` or `outro:bullet-1`.
3. Add an entry to `notes.notes` in `src/notes.json` under that id. Slides without notes still work. Ids in the notes file that match no slide log a console warning.

New scenes go in `src/scenes/` and must be listed in `src/scene-list.ts` (the single scene list used by the editor and the presenter pages).

## Notes file format (`src/notes.json`)

```json
{
  "key": "demo-talk",
  "title": "Demo Talk Presenter",
  "session_title": "Demo Talk",
  "notes": {
    "intro:title": {
      "s": "14:05", "e": "14:12",
      "link": ["pricing page", "https://example.com/pricing"],
      "items": [["SAY", "text"], ["ASK", "question?", "Q-14"], ["WALK", "The flow", null, ["step 1", "step 2"]]],
      "tips": [["From the data", "62% annual"], ["Competitor page", "detail", "https://example.org", "Competitor pricing"]]
    }
  },
  "why": { "intro:title": { "1": "why item 1 matters" } }
}
```

- `key` namespaces all saved browser state. Change it for every new talk.
- `s` / `e` are the planned wall-clock slot (24h `HH:MM`). The slot turns amber in the last minute and red once over.
- `link` is `[label, url]`; it shows as a button on the console and, on mouse move, on the audience page (opens in a new tab).
- Items are `[kind, text, id?, steps?]`. Kinds: `SAY` Say, `ASK` Ask, `LEAVE` Leave with, `SHOW` Show, `CONFIRM` Confirm, `FIX` Pain point, `WALK` Walk through (with `steps`). `id` shows as a small chip.
- `why` maps a slide id to 1-based item numbers; the line shows under the item when the Why toggle is on.
- Tips are `[label, detail, url?, urlLabel?]`.

## Keyboard shortcuts

| Key | Where | Action |
| --- | --- | --- |
| Right, Down, PageDown | both | next slide (clicker works) |
| Left, Up, PageUp | both | previous slide |
| Space | presenter | check the next item |
| Space | audience | next slide |
| Backspace | presenter | uncheck the last item |
| Escape | presenter | cancel the auto-advance countdown; leaves the notes box |
| F | audience | toggle fullscreen |

Auto-advance (toggle in the console, remembered) starts a 3 second countdown after the last item is checked; Escape or a click cancels it. Clicking an item or a slide in the sidebar also works.

## Live notes

The per-slide notes box autosaves to localStorage and to `notes/live-notes.json` through the dev server (`GET`/`POST /api/live-notes`), so you can commit them. On load, notes already in the browser win; the file fills in the rest.

## Start a new talk

Copy this folder (without `node_modules`), then:

1. Edit `package.json` name, `src/notes.json` (`key`, titles, notes) and replace the scenes in `src/scenes/` and `src/scene-list.ts`.
2. Empty `notes/live-notes.json` (`{}`).
3. `npm install && npm start`.
