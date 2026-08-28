# Story 02-01 — Room state persistence

**Status:** done, pending review  
**Branch:** `feat/02-01-room-state-persistence`

## Goal

Give each Room Durable Object one validated authoritative state value that can be
rehydrated after hibernation and copied safely into reconnect snapshots.

## Implementation

- Centralized the durable storage key and initial room-state construction.
- Validated state both when reading from and writing to Durable Object storage.
- Added validated, isolated `roomState` snapshots with the reconnecting
  connection's `selfId`.
- Kept the state lazy until reservation/connection lifecycle lands in Story
  02-02/02-04.
- Added unit coverage for initial state, corrupt persisted state, and snapshot
  isolation.

## Verification

- `pnpm --filter @wordle-clash/server test`
- `pnpm --filter @wordle-clash/server typecheck`
