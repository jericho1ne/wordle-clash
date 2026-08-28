# Story 02-09 — Room Durable Object tests

**Status:** done, pending review.

## Scope

- Configure `@cloudflare/vitest-pool-workers` against the real Worker entrypoint
  and Wrangler bindings.
- Run Durable Object WebSocket tests with one worker and shared storage, as
  required by Cloudflare's hibernating WebSocket test support.
- Exercise the authenticated Worker route and real `Room` Durable Object rather
  than mocking PartyServer internals.
- Cover initial and second-player snapshots, join broadcast, host reassignment,
  ready gating, malformed frames, and room capacity.

## Acceptance

- Tests connect through `/ws/room/:code` using signed short-lived tickets.
- The second connection receives both players and the first receives
  `playerJoined`.
- Leaving host ownership passes to the earliest remaining player.
- `startMatch` returns `NOT_READY` until both players are ready, then broadcasts
  `matchStarting`.
- Invalid JSON returns `BAD_MESSAGE`; the ninth distinct player receives
  `ROOM_FULL`.

## Verification

- `pnpm --filter @wordle-clash/server test`
