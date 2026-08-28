# Story 02-02 — Room connection lifecycle

**Status:** done, pending review  
**Branch:** `feat/02-02-room-connection-lifecycle`

## Goal

Turn the Room Durable Object into the authenticated, hibernation-safe authority
for live lobby membership and mutations.

## Implementation

- Parsed the trusted identity headers injected by the Worker ticket boundary.
- Stored minimal identity state on each hibernating socket and tagged sockets by
  user, so multiple tabs remain one player.
- Added capacity and late-join rejection, player registration/reconnect, full
  snapshots, and persisted-before-broadcast join/update events.
- Added strict message parsing and dispatch for ready, mode, profile, start,
  leave, and ping messages.
- Added 30-second disconnected-player grace deadlines in durable storage with a
  single rescheduled alarm and empty-room state cleanup.
- Added exact JSON ping/pong auto-response for hibernating sockets. The client
  sends a heartbeat every 15 seconds and when a hidden tab becomes visible.
  Cloudflare records auto-response timestamps without waking the Durable Object;
  a 90-second alarm sweep closes stale sockets and removes their players.

Host reassignment after the grace deadline remains Story 02-05; until then a
departed host leaves `hostId = null`.

## Verification

- `pnpm --filter @wordle-clash/server test`
- `pnpm --filter @wordle-clash/server typecheck`
- Connect two authenticated sockets and confirm both receive the same room state.
- Open a second tab for one identity; close one tab and confirm the player stays
  connected until the final tab closes.
