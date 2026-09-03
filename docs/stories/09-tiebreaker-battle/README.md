# Epic 09 — Tiebreaker Battle

**Status:** not started.

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
| [00](./00-tiebreaker-battle-plan.md) | Stack plan: scoring numbers, sudden-death rule, route shape, game-rules.md update | Reviewable implementation contract |
| 01 | Move `docs/fractal/*` into `apps/web/src/features/tiebreaker/`; DEV-gated `/tiebreaker` playground with mock 2-player state, keyboard input, real beatmap | Playable in a browser, no server involvement |
| 02 | Protocol extension: `danceOff*` messages, shared judging helper | Round-trip protocol + judging unit tests |
| 03 | Room DO authority: start/score/end the dance-off on entering `tiebreak` | Two clients race a server-scored battle |
| 04 | Wire `/room/:code/tiebreaker` to `useRoomStore`; spectator mode; `GameplayScreen` handoff | Full tie → battle → winner flow in the app |
| 05 | Epic verification gate | Two/three-browser-context test passes |

## Verification

Baseline: [`../../verification.md`](../../verification.md), plus:

- shared judging helper unit tests (perfect/good/miss boundaries);
- two-client sync-mode tie → dance-off → deterministic winner, via real
  browser contexts;
- a third spectating client sees live scores/fractals with no input capture;
- reconnect during an in-progress dance-off recovers server-authoritative
  state rather than restarting the battle;
- `/tiebreaker` playground is unreachable in a production build
  (`import.meta.env.DEV` gate); `/room/:code/tiebreaker` redirects away when
  `match.phase !== 'tiebreak'`.
