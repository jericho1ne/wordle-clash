import {
  DEFAULT_SYNC_ROUND_DURATION_MINUTES,
  DEFAULT_GAME_MODE,
  MAX_PLAYERS,
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
  if (!value || typeof value !== 'object') return roomStateSchema.parse(value)

  const stored = value as { players?: unknown, syncRoundDurationMinutes?: unknown }
  const players = Array.isArray(stored.players)
    ? stored.players.map((player, index) => (
      player && typeof player === 'object' && !('playerColorId' in player)
        ? { ...player, playerColorId: index % MAX_PLAYERS }
        : player
    ))
    : stored.players

  return roomStateSchema.parse({
    ...stored,
    players,
    syncRoundDurationMinutes: stored.syncRoundDurationMinutes ?? DEFAULT_SYNC_ROUND_DURATION_MINUTES,
  })
}

/** Return a validated clone so callers cannot mutate authoritative state. */
export function createRoomSnapshot(state: RoomState, selfId: string): RoomStateMessage {
  return {
    t: 'roomState',
    room: roomStateSchema.parse(state),
    selfId,
  }
}
