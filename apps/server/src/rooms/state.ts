import {
  DEFAULT_GAME_MODE,
  roomStateSchema,
  type RoomState,
  type RoomStateMessage,
} from '@wordle-clash/shared'

export const ROOM_STATE_STORAGE_KEY = 'state'

export function createInitialRoomState(
  roomCode: string,
  createdAt = Date.now(),
): RoomState {
  return roomStateSchema.parse({
    roomCode,
    phase: 'lobby',
    hostId: null,
    gameMode: DEFAULT_GAME_MODE,
    players: [],
    createdAt,
  })
}

export function parseStoredRoomState(value: unknown): RoomState {
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
