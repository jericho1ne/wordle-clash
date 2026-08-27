# 05 · shared package

**Status:** done

## Done

`packages/shared` — `@wordle-clash/shared`, `type: module`, dep `zod` 4, consumed
by both apps via `workspace:*` (source imported directly; `main`/`types` point at
`src/index.ts`).

Modules (`src/`):

| File | Contents |
|---|---|
| `avatars.ts` | `AVATAR_STEPS` (5 entries, `bg`/`text` as Ember CSS vars — one per palette family), `AVATAR_COUNT`, `clampAvatarId`, `getAvatarStep` |
| `game-modes.ts` | `GameMode`, `GAME_MODES` (`sync` / `realtime` with `label`, `tries`, exact prototype `description`), `DEFAULT_GAME_MODE`, `isGameMode` |
| `room-code.ts` | `ROOM_CODE_REGEX` (`LLLL-DDDD`, no I/O), `generateRoomCode(rng?)`, `normalizeRoomCode`, `isValidRoomCode` |
| `room.ts` | `RoomPhase`, `Profile`, `Player`, `RoomState`, `MAX_PLAYERS` (8), `MIN_PLAYERS_TO_START` (2), `MAX_NAME_LENGTH` (14), `canStartMatch` |
| `protocol.ts` | Client/server message discriminated unions + `RoomErrorCode` + `PROTOCOL_VERSION`. **Types only** — zod schemas + parse/serialize helpers land in epic 02. |
| `index.ts` | Re-exports all of the above |

Config: `tsconfig.json` (`composite`-free, emits to `dist` for `build`),
`vitest.config.ts` (node env, `src/**/*.test.ts`).

## Acceptance

- `pnpm --filter @wordle-clash/shared typecheck` passes.
- Both apps can `import { normalizeRoomCode, GAME_MODES, AVATAR_STEPS } from '@wordle-clash/shared'`.
- Unit tests for `room-code` / `game-modes` / `avatars` land with epic 02 (which
  adds the `protocol` zod schemas and their tests alongside).
