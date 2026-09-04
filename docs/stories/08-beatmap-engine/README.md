# Epic 08 — Beat Map Engine

**Status:** done.

Given an audio track, deterministically produce a `Beatmap`: a sorted list of
`{ timeMs, lane }` entries derived from the track's real kick/snare onsets,
checked into the repo as a JSON asset next to the audio file. This is the
fair, server-verifiable source of truth the Tiebreaker Battle dance-off
(Epic 09) scores against — both the browser gameplay and the `Room` DO's
authoritative scoring read the same file, so timing is never trusted from an
individual client.

The track under analysis is `apps/web/public/audio/canto-de-ossanha.mp3`.

## Dependencies

None — this epic is a standalone offline analysis tool plus a shared schema.
It has no server or protocol dependency and can be built and verified before
Epic 09 exists.

## Stories

| # | Story | Testable outcome |
|---|---|---|
| [00](./00-beatmap-engine-plan.md) | **Done:** stack plan, onset-detection approach, JSON schema | Reviewable implementation contract |
| 01 | **Done:** `packages/shared/src/beatmap.ts` — `Lane`/`BeatmapEntry`/`Beatmap` zod schema, gap/lane-balance validators | Unit tests pass with no audio dependency |
| 02 | **Done:** offline Node analysis script decodes `canto-de-ossanha.mp3`, detects kick/snare onsets, writes `apps/web/public/audio/canto-de-ossanha.beatmap.json` (796 entries, ~3 notes/sec avg) | Script run produces a schema-valid, deterministic JSON file |
| 03 | **Done:** `/beatmap-preview` route: plays the track, scrolls the generated beatmap in sync, with a playback-speed slider (defaults 60%) | Verified in-browser — beatmap loads and lanes flash on their notes |

## Beat detection approach

Energy-based onset detection over the decoded PCM, run offline (Node,
`AudioContext`/FFT — no realtime constraint): a kick is a transient in the
~40-120Hz band, a snare is a transient in the ~150-400Hz band plus broadband
noise energy. Each detected onset is classified kick or snare and assigned
alternately to a lane pair (kick → Up/Down, snare → Left/Right) so consecutive
same-type hits don't repeat a single key. A minimum gap (120ms) between any
two entries keeps the chart physically playable; a density knob (target
notes/sec) caps how many onsets are kept when the track is busier than a
player can reasonably hit.

## Verification

Baseline: [`../../verification.md`](../../verification.md), plus:

- schema validation and min-gap enforcement unit tests;
- deterministic output — re-running the script against the same audio file
  produces byte-identical JSON;
- manual: `/beatmap-preview` played back with the track audibly confirms
  Up/Down land on kicks and Left/Right land on snares.

**Note:** `/beatmap-preview` is deliberately shipped to production (not
DEV-gated) so people can test it on the deployed URL — see the note in
`apps/web/src/router.tsx`. Re-add the DEV gate before general release.
