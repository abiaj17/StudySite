# Terra — project brief for Claude

Read this first before making changes. It's how I brief a new Claude Code session on this codebase so we don't waste tokens rediscovering the shape.

**Display name is Terra** (renamed from "Study Orbit" — that name was too common). The repo folder, `package.json` script context, Vercel project, and live URL still say `study-orbit`; only user-facing text (title, header, export filenames) changed. Renaming the folder/Vercel project/URL is a separate step nobody's asked for yet.

## What this is

A student assignment / test tracker with a monthly calendar view. Users add classes, then assignments and tests under those classes; the app auto-schedules study sessions leading up to each test.

Live at: **https://study-orbit-zeta.vercel.app** (deployed on Vercel, production alias)

## Stack

- **React 18 + TypeScript + Vite** — chosen for fast local dev and painless static deploy
- **Tailwind CSS 3.4** — utility classes, no shadcn/ui components actually used (the init pulled them in, safe to ignore)
- **No backend.** State persists in `localStorage` under key `study-orbit-v1` — left unrenamed on purpose, changing it would drop everyone's saved data. Per-browser only — no cross-device sync yet.

## Source layout

```
src/
  App.tsx                    ← top-level state + layout
  main.tsx                   ← react-dom entry
  index.css                  ← Tailwind + custom animations + monochromatic theme tokens
  lib/
    types.ts                 ← ClassItem, Assignment, TestItem, StudySession, AppState
    date.ts                  ← ISO date helpers, buildMonthGrid, friendlyDelta
    store.ts                 ← loadState/saveState/seed + generateStudySessions + THEMES
                               + exportState/parseImport (JSON backup)
    apClasses.ts             ← Leander ISD AP catalog presets + 4 grouping modes
  components/
    Calendar.tsx             ← monthly grid, day cells, urgency "heat" glow
    DayPanel.tsx             ← selected-day detail (right rail / mobile stack)
    UpcomingRail.tsx         ← overdue, weekly progress, Focus Today, next 14 days
    ListView.tsx             ← flat searchable list of all work (the "List" tab)
    ThemeBar.tsx             ← 5 preset hue pills + custom color-wheel picker
    Modals.tsx               ← Add/edit assignment, test, classes
    ClassPicker.tsx          ← AP catalog picker inside the classes modal
    icons.tsx                ← inline SVG icon set (no icon library)
```

## Theming — how the monochromatic system works

Everything in the UI is derived from **two CSS custom properties**: `--hue` (0–360) and `--sat` (0–85%). Set on `:root`, updated at runtime from React (`App.tsx` `useEffect`). All colors — backgrounds, borders, text, accents — are `hsl()` expressions off those two variables. That's why swapping themes retints the whole app in one paint.

5 presets are defined in `src/lib/store.ts` (`THEMES`). Custom wheel is in `ThemeBar.tsx` — click-drag a point inside the wheel to pick hue/saturation.

**Class colors** are a *controlled* deviation from monochromatic: each class has a `tint` (±90°) that shifts its dot color relative to the theme hue. This is on purpose — students need to distinguish classes at a glance. If a purist ever complains about mono-purity, that's the trade-off.

## Study session generation

`generateStudySessions(test)` in `store.ts`. For each test, it schedules sessions at **7, 5, 3, 1 days before**, split by weights `[0.15, 0.2, 0.25, 0.4]` of `test.studyHours * 60` minutes. Naive but feels smart. If you rewrite this into real spaced repetition, add topic-mastery ratings to `TestItem` first.

Slots that would land **in the past are dropped**, and the remaining weights are re-normalized so the student still gets the full `studyHours` they asked for. Known trade-off: a test added 2 days out puts every minute into a single session. Load-spreading across days (and across other tests in the same week) is the next real improvement here.

Editing a test regenerates its sessions, but `upsertTest` in `App.tsx` carries `done` across by matching on `focus` — otherwise fixing a typo would reset every checkbox.

## Fake data policy

`seed()` returns empty arrays. **Do not re-introduce demo data.** Owner explicitly wants a clean slate.

## Font

**Inter everywhere**, body and display both. Loaded via `@import` in `index.html` at weights 400–900.

`.font-display` is Inter at `font-weight: 900` / `letter-spacing: -0.03em`. Large Inter needs the negative tracking and the heavy weight or it just reads as body text scaled up.

Previously this was Ranchers, which had a descender-clipping problem that forced `line-height: 1.15` and `padding-bottom` on display headings. Inter doesn't have that issue — those rules are still in `Calendar.tsx` and `ListView.tsx` but are no longer load-bearing.

## Deploy

Production is on Vercel, project name `study-orbit`, team `abiaj17s-projects`. Vercel auto-detects Vite. The `main` branch (once connected to git) auto-deploys on push.

`SSO protection is disabled` on the project. If it ever silently comes back and the URL 401s, that's the first thing to check.

## What's NOT in here yet (the roadmap)

Ordered by likely value:

1. **Accounts + database sync** — the app is a Tier-1 demo until users can log in and see their data across devices. Best fast path: Supabase (Postgres + auth). Requires: a `users` table, migrate the current shape into DB tables (`classes`, `assignments`, `tests`, `study_sessions`), swap `loadState`/`saveState` for API calls, add a login page.
2. **Push / email reminders** — "you have X due tomorrow." Needs a server-side cron and a user email.
3. **Course import** — paste a syllabus, Claude parses it into classes/assignments/tests.
4. **Grade tracking** — attach a grade per completed assignment; roll up per class.
5. **Mobile PWA install** — add manifest.json + service worker so it installs to home screen.

## How I like to work

- Small commits. Ship small. Test in browser.
- Push back if I ask for something that makes the UX worse.
- Skip apologies. Just fix.
- If a design choice conflicts with a stated constraint (e.g. "monochromatic" vs. "distinguish classes at a glance"), surface the conflict and pick one — don't quietly break the constraint.

## Common commands

```bash
pnpm install         # install deps
pnpm dev             # local dev server (http://localhost:5173)
pnpm build           # production build to ./dist
pnpm preview         # serve the built site locally
```

## Known quirks

- The Vercel deploy uses a **single-file** collapsed `App.tsx` (all components inlined) because the deploy tool has a per-call size limit. This repo has the **multi-file** version — cleaner to work in. If you re-deploy manually, either use the Vercel dashboard's "import from git" flow (once connected) or inline back to one file. Don't sweat it — connecting the repo to Vercel eliminates that entirely.
- `React.StrictMode` is on. Effects will run twice in dev. That's normal.
