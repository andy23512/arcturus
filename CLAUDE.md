# CLAUDE.md

## What this is

Arcturus is a "Your Life in Weeks" style visualization (inspired by bryanbraun.com/your-life/weeks.html), extended to highlight how much of that life has been spent typing with a CharaChorder chorded-keyboard device. The user enters their birthday plus two CharaChorder-related dates; the app renders a 90-year grid of weeks and a stats panel, and the whole thing is printable.

## Tech stack

- React 19 + TypeScript, built with Vite 8
- No state library — plain `useState` for the form → results toggle
- Linting: `oxlint`

## Commands

- Install: `npm install`
- Dev server: `npm run dev` (Vite, default port 5173)
- Build: `npm run build` (runs `tsc -b` then `vite build`)
- Preview production build: `npm run preview`
- Lint: `npm run lint` (oxlint)

There is no test script/framework configured in this repo.

## Structure

- `src/App.tsx` — top-level: shows `DateForm` until the user submits, then `StatsPanel` + `WeeksGrid`, plus Print / Start over actions
- `src/lib/weeks.ts` — all date math: local-calendar-date parsing (`parseDateInput`), `buildWeekStates` (per-week classification: `future | pre-chara | chara-partial | chara-full`), `computeStats`, and `validateInput`
- `src/types.ts` — shared types (`LifeWeeksInput`, `WeekState`, `Stats`, form value/error shapes)
- `src/components/DateForm.tsx` — the 3-date input form (birthday, CharaChorder start, optional fully-switched date)
- `src/components/WeeksGrid.tsx` — 52-column × 90-row CSS Grid of week squares, decade row labels, legend
- `src/components/StatsPanel.tsx` — labeled stat tiles

## Notable/non-obvious points

- `vite.config.ts` sets `base: '/arcturus/'` — deployed under a `/arcturus/` subpath, not the domain root.
- Dates are deliberately parsed/compared as local calendar dates at midnight (`parseDateInput`/`startOfToday` in `src/lib/weeks.ts`), not via `new Date("YYYY-MM-DD")` (which parses as UTC midnight). This avoids a user's own "today" being misclassified as a future date depending on their UTC offset.
- The grid horizon is a fixed 90-year lifespan (`TOTAL_WEEKS = 4680`), not user-configurable by design.
- `@media print` in `src/App.css` hides everything with the `.no-print` class and forces `print-color-adjust: exact` so the week-state background colors actually survive printing (browsers drop background colors by default).
- This project is not yet wired into the `andy23512.github.io` portfolio site (`index.astro` card / `stars.ts` `key` for the Arcturus star) — that integration was intentionally deferred.
