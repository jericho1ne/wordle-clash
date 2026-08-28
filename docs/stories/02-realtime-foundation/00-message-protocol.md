# Story 02-00 — Message protocol

**Status:** done, pending review  
**Branch:** `feat/02-00-message-protocol`

## Goal

Make the shared WebSocket contract enforceable at runtime before the Worker and
browser begin exchanging room events.

## Implementation

- Added strict Zod schemas for every existing client and server message.
- Added nested runtime schemas for players and room snapshots.
- Derived exported TypeScript message types directly from the schemas.
- Added symmetric parse/serialize helpers for text and UTF-8 binary frames.
- Added `assertNever()` for exhaustive message dispatch.
- Added unit coverage for round trips, binary frames, malformed JSON, unknown
  properties/types, invalid profile fields, and nested room validation.

## Verification

- `pnpm --filter @wordle-clash/shared test`
- `pnpm --filter @wordle-clash/shared typecheck`
