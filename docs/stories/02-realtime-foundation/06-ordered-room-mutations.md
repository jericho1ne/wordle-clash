# Story 02-06 — Ordered room mutations

**Status:** done, pending review  
**Branch:** `refactor/02-06-ordered-room-mutations`

## Goal

Guarantee one authoritative mutation order even when Durable Object storage
operations yield, so later gameplay races cannot observe or publish competing
states.

## Implementation

- Added a rejection-safe FIFO `MutationQueue`.
- Serialized connection, message, close, error, alarm, and reservation RPC
  mutations through the same queue.
- Kept every mutation's ordering as mutate → persist → publish.
- Centralized validated full-snapshot sending for connect/reconnect.
- Added unit coverage proving pending work blocks later operations and a failed
  operation does not poison the queue.

## Verification

- `pnpm --filter @wordle-clash/server test`
- `pnpm --filter @wordle-clash/server typecheck`
