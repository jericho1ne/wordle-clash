# Epic 09 — Tiebreaker Battle

**Status:** implemented; full live-match verification pending (see
Verification below).

Resolves a sync-mode tie (`match.phase === 'tiebreak'`, `tiebreakPlayerIds`,
introduced in Epic 07 story 06) into a real winner via a DDR-style dance-off:
tied players hit arrow lanes timed to the real audio track's kicks and
snares, judged against Epic 08's checked-in beatmap. Everyone else in the
room spectates. A beat-reactive WebGL fractal (moved into app code from
`docs/fractal/`) is the arena background, pulsing on every server-confirmed
hit.

## Dependencies

1. Epic 07's persisted `tiebreak` phase and `tiebreakPlayerIds` on
   `MatchSnapshot` (`packages/shared/src/gameplay.ts`,
   `apps/server/src/rooms/Room.ts`).
2. Epic 08's `Beatmap` schema and the checked-in
   `apps/web/public/audio/canto-de-ossanha.beatmap.json`.

## Dance-off rules

Replaces the "forthcoming" note in `docs/game-rules.md`:

- Exactly the players in `tiebreakPlayerIds` battle; every other connected
  player spectates (read-only: both dancers' fractals + live scores, no
  input capture).
- The battle runs against a fixed clip of the beatmap (first 20s), same
  start offset for every player — nobody gets an easier slice of the song.
- Each lane hit is judged against the nearest beatmap entry in that lane:
  perfect / good / miss timing windows, flat point values per judgment (no
  combo multiplier in v1 — keeps scoring simple and the PR small).
- Winner = highest score when the clip ends. An exact score tie triggers one
  more short clip (sudden death) rather than an invented secondary rule.
- The server is the sole judge of hits — a client reporting "perfect" never
  overrides the DO's own comparison against the beatmap.

## Stories

| # | Story | Testable outcome |
|---|---|---|
| [00](./00-tiebreaker-battle-plan.md) | **Done:** stack plan: scoring numbers, sudden-death rule, route shape, game-rules.md update | Reviewable implementation contract |
| 01 | **Done:** move `docs/fractal/*` into `apps/web/src/features/tiebreaker/`; `/tiebreaker` playground with mock 2-player state, keyboard input, real beatmap | Verified in-browser — playable, fractals render, keyboard input scores |
| 02 | **Done:** protocol extension: `danceOff*` messages, shared judging helper | Round-trip protocol + judging unit tests written (not run this session — see Verification) |
| 03 | **Done:** Room DO authority: start/score/end the dance-off on entering `tiebreak` | Unit tests written for scoring/consumption/winner logic (not run this session) |
| 04 | **Done:** wire `/room/:code/tiebreaker` to `useRoomStore`; spectator mode; `GameplayScreen` handoff | Verified in-browser that the route renders cleanly with no server state; full live-tie walkthrough not yet run (see Verification) |
| 05 | Epic verification gate | **Partially done** — see Verification below for what's confirmed vs. outstanding |

## Verification

Baseline: [`../../verification.md`](../../verification.md), plus this epic's
checklist below. **Confirmed this implementation session:**

- `/tiebreaker` (playground, deliberately shipped to production — not
  DEV-gated — so people can test it on the deployed URL; re-add the DEV
  gate before general release) renders both fractal-backed dance floors,
  loads the real generated beatmap, captures per-player keyboard input, and
  scores a mistimed press as a miss rather than crediting a hit — verified
  live in-browser with screenshots and simulated key presses.
- `/beatmap-preview` and `/room/:code/tiebreaker` (with no active room)
  render cleanly with no console errors beyond an unrelated favicon 404.
- A React StrictMode dev bug in `beatFractalEngine.destroy()` (forcing
  `WEBGL_lose_context` raced the mount→unmount→remount cycle) was found and
  fixed via this same in-browser testing.
- Unit tests were **written** for the beatmap schema, dance-off judging
  helpers (shared package), and the Room DO's scoring/consumption/winner
  logic (server package) — see `packages/shared/src/{beatmap,dance-off,
  protocol}.test.ts` and `apps/server/src/gameplay/dance-off.test.ts`.

**Not yet run/verified — outstanding before this epic is fully done:**

- `pnpm test`, `pnpm typecheck`, and `pnpm lint` have not been run against
  this branch's changes (this session's operator preference is to not run
  build/lint/test commands automatically). Run `pnpm check` before merging.
- A full two-browser live walkthrough (two real player identities: tie a
  sync round → both land on `/room/:code/tiebreaker` → dancer input scores
  via server broadcast → clip ends → winner declared → host returns to
  lobby) has **not** been executed. It was attempted with an isolated
  `wrangler dev`/Vite pair on alternate ports, but the local dev auth origin
  allowlist is hardcoded to `http://localhost:5173`
  (`apps/server/src/auth.ts`), which was already occupied by another
  session. To run it: `pnpm dev`, add `GAMEPLAY_TEST_ANSWER=CLASH` to
  `apps/server/.dev.vars` for a deterministic win, open two browser profiles
  (or a normal + incognito window) on `:5173`, create a room in sync mode,
  join with the second profile, both submit `CLASH` in the same round.
- Reconnect-mid-battle and the sudden-death (exact-tie) path are implemented
  (`Room.ts` `#endDanceOff`) but not exercised by a live test — worth
  covering explicitly in the manual walkthrough above.
- Spectator view (a third connected player who isn't in `tiebreakPlayerIds`)
  is implemented but not visually confirmed with a live third client.
