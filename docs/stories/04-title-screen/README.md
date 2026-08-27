# Epic 04 — Title screen

**Status:** not started (epic-00 placeholder in `src/features/title/TitleScreen.tsx`).

Faithful port of the prototype's title screen.

## Stories

| # | Story |
|---|---|
| 00 | `/` route, centered `.app-stage`, no `.nav`; renders before identity mint completes |
| 01 | Logo tiles spelling **C L A S H** (54px, row `perspective: 600px`, `tileFlip 0.5s` staggered 0/80/160/240/320ms); 3 tile states (empty outline / present outline-accent / correct filled `--color-accent-700`) in a fixed per-letter pattern matching the prototype; `prefers-reduced-motion` respected |
| 02 | 11px uppercase "Multiplayer" kicker; wordmark **"Wordle Clash"** (32px, heading, weight 500); tagline "Race friends to the word. Tie for first? Settle it in a bboy dance-off."; `<Button variant="primary" block>` "Play" + trailing `ArrowRight` → `navigate('/setup')` |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0. Epic-specific:

- `/` matches the prototype screenshot: 5 tiles spell **CLASH**, flip in with the
  0/80/160/240/320ms stagger, tile states match the fixed pattern; wordmark reads
  "Wordle Clash".
- **Play** navigates to `/setup`.
- Screen paints before the anonymous identity finishes minting (throttle network
  to confirm no blank flash).
- Under `prefers-reduced-motion: reduce` the tiles appear without flipping.
- `pnpm --filter @wordle-clash/web test` — any title component logic.
