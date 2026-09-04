# Story 09-00 — Tiebreaker battle plan

**Status:** done
**Branch:** `feat/pulsing-fractal-background-for-ddr-battle` (direct commits, no stack)

## Goal

Pin the scoring, routing, and protocol shape before touching gameplay code,
so the Room DO, protocol, and UI stories all build against the same contract.

## Decisions

- **Scoring:** perfect / good / miss timing windows around each beatmap
  entry's `timeMs`, flat points per judgment (e.g. perfect=3, good=1,
  miss=0). No combo multiplier in v1.
- **Duration:** fixed 20s clip from the start of the beatmap — identical for
  every player, so nobody races a harder or easier section of the song.
- **Tie-of-a-tie:** an exact score tie at clip end re-runs one more short
  clip (sudden death) rather than inventing a secondary tiebreaker rule.
  This can loop in the rare case of a repeated exact tie.
- **Authority:** the `Room` DO is the sole judge of every hit — it compares
  each `submitDanceHit` against the shared beatmap itself. Client-side
  judgment (if any, for local audio-visual feedback) is optimistic/cosmetic
  only and never trusted for the score that decides the winner.
- **Routes:**
  - `/tiebreaker` — DEV-only (`import.meta.env.DEV`, same gate as
    `/design-system`) standalone playground: mock 2-player local state, real
    keyboard input, real beatmap, zero server dependency. Exists purely to
    iterate on feel/visuals fast and stays out of production builds.
  - `/room/:code/tiebreaker` — the real, guarded route, mirroring
    `/room/:code/play`. Redirects away (`<Navigate>`, matching
    `GameplayScreen`'s existing pattern) unless the room's `match.phase ===
    'tiebreak'`. Tied players get interactive input; every other connected
    player in the room lands on the same screen in spectator mode.
- **Protocol:** `danceOff*` messages are additive to the existing
  discriminated unions in `packages/shared/src/protocol.ts` — no breaking
  change to `matchSnapshotSchema`. Score broadcasts are throttled (not
  per-hit) to avoid the re-render storm `beatFractalStore.ts`'s own comments
  warn against; beat pulses themselves stay fully imperative
  (`bgRef.current.pulse()`), never routed through Zustand/React state.
- **Fractal code migration:** `docs/fractal/*` becomes real app code under
  `apps/web/src/features/tiebreaker/`, unchanged in its imperative
  architecture. `MultiplayerBeatSync.example.tsx` stays reference-only for
  the wiring pattern; the real `TiebreakerScreen` wires to `useRoomStore`/the
  existing `RoomSocket`, not a bare `usePartySocket` call.
- **`docs/game-rules.md`:** the "rules for timed tap/rhythm minigame are
  forthcoming" note is replaced with the rules from this epic's README.

## Stack policy

Direct commits to the current branch per explicit instruction (see the
approved plan) — no `gh stack` layering for this feature. Each story below is
still committed as its own reviewable, working slice.
