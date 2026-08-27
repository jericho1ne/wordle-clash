import type { GameMode } from './game-modes.js'

/** Lobby is pre-match; `starting` is the brief window after "Start game". */
export type RoomPhase = 'lobby' | 'starting'

/** Player-editable identity. `name` <= 14 chars, `avatarId` is 0..4. */
export interface Profile {
  name: string
  avatarId: number
}

export interface Player {
  /** Stable user id (anonymous or account) — the identity key. */
  id: string
  name: string
  avatarId: number
  isHost: boolean
  ready: boolean
  /** True while the player holds >= 1 live socket. */
  connected: boolean
  /** Epoch ms of first join; used to order host reassignment. */
  joinedAt: number
}

/** Authoritative room state owned by the room's Durable Object. */
export interface RoomState {
  roomCode: string
  phase: RoomPhase
  hostId: string | null
  gameMode: GameMode
  /** Insertion order preserved. */
  players: Player[]
  createdAt: number
}

export const MAX_PLAYERS = 8
export const MIN_PLAYERS_TO_START = 2
export const MAX_NAME_LENGTH = 14

/** Whether the host is allowed to start given current room state. */
export function canStartMatch(room: Pick<RoomState, 'players' | 'phase'>): boolean {
  return (
    room.phase === 'lobby' &&
    room.players.length >= MIN_PLAYERS_TO_START &&
    room.players.every((p) => p.ready)
  )
}
