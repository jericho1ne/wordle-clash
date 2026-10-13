# 05 · shared package

**Status:** done

## Done

The `@wordle-clash/shared` package uses `type: module` and zod 4, and is consumed
by both apps through the workspace protocol with source imported directly.

Modules:

| Module | Contents |
|---|---|
| Avatars | `AVATAR_STEPS` (5 entries, `bg`/`text` as Ember CSS vars — one per palette family), `AVATAR_COUNT`, `clampAvatarId`, `getAvatarStep` |
| Game modes | `GameMode`, `GAME_MODES` (`sync` / `realtime` with `label`, `tries`, exact prototype `description`), `DEFAULT_GAME_MODE`, `isGameMode` |
| Room codes | `ROOM_CODE_REGEX` (`LLLL-DDDD`, no I/O), `generateRoomCode(rng?)`, `normalizeRoomCode`, `isValidRoomCode` |
| Room state | `RoomPhase`, `Profile`, `Player`, `RoomState`, `MAX_PLAYERS` (8), `MIN_PLAYERS_TO_START` (2), `MAX_NAME_LENGTH` (14), `canStartMatch` |
| Protocol | Client/server message discriminated unions + `RoomErrorCode` + `PROTOCOL_VERSION`. **Types only** — zod schemas + parse/serialize helpers land in epic 02. |
| Public API | Re-exports all of the above |

Configuration is composite-free, emits the build output, and runs unit tests in
a Node environment.

## Acceptance

- `pnpm --filter @wordle-clash/shared typecheck` passes.
- Both apps can `import { normalizeRoomCode, GAME_MODES, AVATAR_STEPS } from '@wordle-clash/shared'`.
- Unit tests for `room-code` / `game-modes` / `avatars` land with epic 02 (which
  adds the `protocol` zod schemas and their tests alongside).
