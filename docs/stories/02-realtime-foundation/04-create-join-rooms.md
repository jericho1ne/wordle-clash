# Story 02-04 — Create and join rooms

**Status:** done, pending review  
**Branch:** `feat/02-04-create-join-rooms`

## Goal

Make room existence explicit: creation reserves a generated code in its named
Durable Object, while joining remains an authenticated WebSocket connection to
an existing reservation.

## Implementation

- Added authenticated `POST /api/rooms` with collision retries and a `201`
  `{ roomCode }` response.
- Added an atomic `Room.reserve(userId)` RPC and typed the Worker DO binding.
- Reserved the creator as host before any socket connects.
- Added a two-minute durable reservation alarm for rooms nobody joins.
- Changed WebSocket connection behavior so unknown/expired room codes return
  `ROOM_NOT_FOUND` instead of lazily creating a room.
- Clear the reservation deadline when the first valid player connects.

## Verification

- Create without a session returns `401`.
- Create with an anonymous session returns a canonical room code and `201`.
- Connecting to the reserved room succeeds; connecting to an arbitrary code
  returns `ROOM_NOT_FOUND`.
- A reservation with no connections is removed after two minutes.
