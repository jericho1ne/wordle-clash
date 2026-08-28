# Story 02-07 — PartySocket client

**Status:** done, pending review.

## Scope

- Wrap `partysocket` behind a room-specific client instead of exposing the
  library throughout React code.
- Fetch a fresh short-lived realtime ticket for the initial connection and
  every reconnect through PartySocket's asynchronous `query` callback.
- Parse every incoming frame with the shared protocol and emit events keyed by
  their discriminant, preserving the exact message type for each listener.
- Serialize outgoing client messages through the shared protocol.
- Treat `ROOM_NOT_FOUND`, `ROOM_FULL`, and `MATCH_STARTED` as terminal join
  errors and stop PartySocket's reconnect loop.
- Surface a temporary connection status and player count in the lobby scaffold
  so the wrapper can be exercised before the full room store lands in 02-08.

## Acceptance

- Opening a valid reserved room shows `Realtime: Connected` and `1 player`.
- A second browser session joining the same URL updates the authoritative
  snapshot and can be observed in the socket frames; the full reactive player
  reducer lands in 02-08.
- Reconnecting requests a new `/api/rt/ticket` rather than reusing an expired
  ticket.
- Opening an unknown, full, or already-started room surfaces the server message
  and does not retry indefinitely.
- Malformed server frames become `protocolError` events and never reach typed
  message listeners.

## Verification

- Start `pnpm dev`, reserve a room with `POST /api/rooms`, and open
  `/room/<roomCode>`.
- In DevTools Network, confirm `/api/rt/ticket` returns 200 followed by a 101
  socket upgrade at `/ws/room/<roomCode>?ticket=…`.
- Stop and restart the Worker; confirm the UI shows `Reconnecting…`, requests a
  new ticket, and returns to `Connected`.
