# Epic 02 — Realtime foundation

**Status:** complete, pending review.

The `Room` Durable Object becomes the authoritative lobby: players, ready state,
game mode, host, reconnection. Fat JSON events over the socket; full `roomState`
snapshot on connect and every reconnect.

## Stories

| # | Story | Status |
|---|---|---|
| [00](./00-message-protocol.md) | Message protocol: zod schemas + `parseClientMessage` / `serializeServerMessage` + `assertNever`; unit tests in `packages/shared` | done, in review |
| [01](./01-room-state-persistence.md) | `Room` state shape + storage layout; `onStart` hydration; validated reconnect snapshot helper | done, in review |
| [02](./02-room-connection-lifecycle.md) | `Room` connection lifecycle on the hibernation API: `onConnect` (identity from injected headers, capacity check → `ROOM_FULL`, add player, send snapshot, broadcast join), `onMessage` (hydrate → zod → dispatch), `onClose`/`onError` (drop socket, `connected:false`, grace-period removal), `setWebSocketAutoResponse` ping/pong, empty-room cleanup alarm | done, in review |
| [03](./03-room-code-generation.md) | Room-code generation module (already in `packages/shared/src/room-code.ts` from epic 00) + tests | done, in review |
| [04](./04-create-join-rooms.md) | Create vs join: `POST /api/rooms` reserves a code via DO RPC `reserve(userId)` + 2-min alarm; join opens the socket; unknown room → `ROOM_NOT_FOUND` | done, in review |
| [05](./05-host-reassignment.md) | Host assignment / reassignment by `joinedAt`; `hostChanged` broadcast | done, in review |
| [06](./06-ordered-room-mutations.md) | Broadcast + snapshot helpers; mutation → persist → broadcast ordering | done, in review |
| [07](./07-partysocket-client.md) | `partysocket` client wrapper: ticket in `query`, typed event emit, terminal-error detection | done, in review |
| [08](./08-zustand-room-store.md) | Zustand room store: status machine, event reducers, optimistic `setReady`, `pendingActions` re-send on reconnect, selector hooks | done, in review |
| [09](./09-room-durable-object-tests.md) | `Room` tests via `@cloudflare/vitest-pool-workers` | done, in review |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0 + the
**two-client realtime test** in §2 (steps 1–6, 9). Epic-specific:

- `pnpm --filter @wordle-clash/shared test` — `protocol` round-trips and rejects
  malformed frames; `room-code` covers no-I/O alphabet, dash placement,
  case-insensitive `normalizeRoomCode`.
- `pnpm --filter @wordle-clash/server test` — join → `roomState` snapshot; second
  join → both connections see each other; host disconnect → reassignment by
  `joinedAt`; ready gating on `startMatch`; malformed frame → `BAD_MESSAGE`;
  9th player → `ROOM_FULL`.
- Kill + restart the Worker mid-session: clients reconnect and re-sync from a
  fresh snapshot; a pending optimistic `setReady` is re-applied.
