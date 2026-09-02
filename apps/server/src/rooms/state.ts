import {
  DEFAULT_SYNC_ROUND_DURATION_MINUTES,
  DEFAULT_GAME_MODE,
  roomStateSchema,
  type RoomState,
  type RoomStateMessage,
} from '@wordle-clash/shared'

export const ROOM_STATE_STORAGE_KEY = 'state'

export function createInitialRoomState(
  roomCode: string,
  createdAt = Date.now(),
  hostId: string | null = null,
): RoomState {
  return roomStateSchema.parse({
    roomCode,
    phase: 'lobby',
    hostId,
    gameMode: DEFAULT_GAME_MODE,
    syncRoundDurationMinutes: DEFAULT_SYNC_ROUND_DURATION_MINUTES,
    players: [],
    createdAt,
  })
}

export function parseStoredRoomState(value: unknown): RoomState {
  if (
    value &&
    typeof value === 'object' &&
    !('syncRoundDurationMinutes' in value)
  ) {
    return roomStateSchema.parse({
      ...value,
      syncRoundDurationMinutes: DEFAULT_SYNC_ROUND_DURATION_MINUTES,
    })
  }

  return roomStateSchema.parse(value)
}

/** Return a validated clone so callers cannot mutate authoritative state. */
export function createRoomSnapshot(state: RoomState, selfId: string): RoomStateMessage {
  return {
    t: 'roomState',
    room: roomStateSchema.parse(state),
    selfId,
  }
}
