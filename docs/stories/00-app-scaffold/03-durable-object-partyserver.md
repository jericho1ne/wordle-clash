# 03 · Durable Object via partyserver

**Status:** done (stub)

## Done

- `partyserver` (server) + `partysocket` (web) added.
- `apps/server/src/rooms/Room.ts` — `class Room extends Server<Env>` with
  `static options = { hibernate: true }`:
  - `onStart()` rehydrates `state` from `ctx.storage.get('state')`.
  - `#save()` persists `state`; `#ensureState()` lazily creates a `lobby`-phase
    `RoomState` keyed by `this.name` (the room code).
  - `onConnect` / `onMessage` / `onClose` are stubs with epic-02 TODOs.
- `wrangler.jsonc` DO binding + `new_sqlite_classes` migration (story 02).
- `src/index.ts` routes `/ws/room/:code` → the DO via `routePartykitRequest`
  with `prefix: 'ws'` (class `Room` → path segment `room`).

## Not in this story (epic 02)

Player registration, the zod message protocol + dispatch, `roomState` snapshot on
connect/reconnect, broadcast helpers, host assignment/reassignment, grace-period
disconnect handling, room-code reservation, empty-room cleanup alarm.

## Acceptance

- A raw WebSocket to `ws://localhost:8787/ws/room/ABCD-1234` connects and the DO
  instance is created (it currently replies with a not-implemented error frame).
