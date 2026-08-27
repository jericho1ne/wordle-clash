/**
 * Client <-> server WebSocket message contract.
 *
 * Phase-1 status: TYPES ONLY. The zod schemas, `parseClientMessage`, and
 * `serializeServerMessage` helpers land in epic 02-realtime-foundation
 * (`00-message-protocol-types`). Everything here is the shared shape both sides
 * compile against in the meantime.
 */
import type { GameMode } from './game-modes.js';
import type { Player, RoomState } from './room.js';

export const PROTOCOL_VERSION = 1;

/* ------------------------------- client -> server ------------------------------- */

export interface SetReadyMessage {
  t: 'setReady';
  ready: boolean;
}
export interface SetGameModeMessage {
  t: 'setGameMode';
  mode: GameMode;
}
export interface UpdateProfileMessage {
  t: 'updateProfile';
  name?: string;
  avatarId?: number;
}
export interface StartMatchMessage {
  t: 'startMatch';
}
export interface LeaveMessage {
  t: 'leave';
}
export interface PingMessage {
  t: 'ping';
}

export type ClientMessage =
  | SetReadyMessage
  | SetGameModeMessage
  | UpdateProfileMessage
  | StartMatchMessage
  | LeaveMessage
  | PingMessage;

export type ClientMessageType = ClientMessage['t'];

/* ------------------------------- server -> client ------------------------------- */

export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'NOT_HOST'
  | 'NOT_READY'
  | 'MATCH_STARTED'
  | 'BAD_MESSAGE'
  | 'RATE_LIMITED';

export interface RoomStateMessage {
  t: 'roomState';
  room: RoomState;
  selfId: string;
}
export interface PlayerJoinedMessage {
  t: 'playerJoined';
  player: Player;
}
export interface PlayerLeftMessage {
  t: 'playerLeft';
  playerId: string;
  hostId: string | null;
}
export interface PlayerUpdatedMessage {
  t: 'playerUpdated';
  playerId: string;
  patch: Partial<Pick<Player, 'name' | 'avatarId' | 'ready' | 'connected'>>;
}
export interface GameModeChangedMessage {
  t: 'gameModeChanged';
  mode: GameMode;
  byPlayerId: string;
}
export interface HostChangedMessage {
  t: 'hostChanged';
  hostId: string;
}
export interface MatchStartingMessage {
  t: 'matchStarting';
  mode: GameMode;
  tries: number;
  playerCount: number;
  /** Epoch ms the match clock starts. */
  startsAt: number;
}
export interface ErrorMessage {
  t: 'error';
  code: RoomErrorCode;
  message: string;
}
export interface PongMessage {
  t: 'pong';
}

export type ServerMessage =
  | RoomStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerUpdatedMessage
  | GameModeChangedMessage
  | HostChangedMessage
  | MatchStartingMessage
  | ErrorMessage
  | PongMessage;

export type ServerMessageType = ServerMessage['t'];
