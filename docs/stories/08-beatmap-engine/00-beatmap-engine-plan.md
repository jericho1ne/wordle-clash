# Story 08-00 — Beat map engine plan

**Status:** done
**Branch:** `feat/pulsing-fractal-background-for-ddr-battle` (direct commits, no stack)

## Goal

Define the beatmap schema and generation approach before writing the
analysis script, so Epic 09's gameplay/server code has a stable contract to
build against.

## Decisions

- The beatmap is generated **offline, once, and checked into the repo** as
  JSON — never analyzed live per-client. This is what makes server-side
  scoring authoritative and fair: the DO and every browser read the exact
  same `{ timeMs, lane }[]` list.
- Schema lives in `packages/shared/src/beatmap.ts`, following the existing
  `protocol.ts` conventions: strict zod objects, exported inferred types, a
  `parseBeatmap` helper.
- `Lane = 'up' | 'down' | 'left' | 'right'`.
- `BeatmapEntry = { timeMs: number (int, >= 0), lane: Lane }`.
- `Beatmap = { trackPath: string, durationMs: number, entries: BeatmapEntry[] }`.
- Invariants enforced by validators (not just types): `entries` sorted
  ascending by `timeMs`; no two entries within 120ms of each other regardless
  of lane (keeps the chart humanly playable); every lane used at least once
  across the chart (lane-balance sanity check, not a hard requirement).
- Onset detection: energy-based band-split (kick ~40-120Hz, snare
  ~150-400Hz + broadband noise), run once offline over decoded PCM — no
  external ML/DSP service, keeps this dependency-light.
- Kick onsets alternate Up/Down; snare onsets alternate Left/Right. This
  keeps the mapping deterministic and avoids the same key repeating back to
  back purely because two kicks landed close together.
- A density/difficulty knob (target notes/sec, default tuned to feel like DDR
  "drumming," not a slow metronome) trims onsets when the track is busier
  than that target, always preserving the 120ms minimum gap.
- The generation script only needs to run once for `canto-de-ossanha.mp3`
  during this build; it's a `pnpm` script, not a build-time step, so no CI
  dependency on audio decoding.

## Stack policy

Direct commits to the current branch per explicit instruction (see the
approved plan) — no `gh stack` layering for this feature. Each story below is
still committed as its own reviewable, working slice.
