import { z } from 'zod'

import {
  ANIMAL_COUNT,
  AVATAR_COUNT,
} from './avatars.js'
import { GAME_MODE_IDS } from './game-modes.js'
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
} from './room.js'
import { ROOM_CODE_REGEX } from './room-code.js'

export const PROTOCOL_VERSION = 1

const idSchema = z.string().min(1)
const timestampSchema = z.number().int().nonnegative()
const gameModeSchema = z.enum(GAME_MODE_IDS)

export const playerSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(MAX_NAME_LENGTH),
  avatarId: z.number().int().min(0).max(AVATAR_COUNT - 1),
  animalId: z.number().int().min(0).max(ANIMAL_COUNT - 1).default(0),
  isHost: z.boolean(),
  ready: z.boolean(),
  connected: z.boolean(),
  joinedAt: timestampSchema,
}).strict()

export const roomStateSchema = z.object({
  roomCode: z.string().regex(ROOM_CODE_REGEX),
  phase: z.enum(['lobby', 'starting']),
  hostId: idSchema.nullable(),
  gameMode: gameModeSchema,
  players: z.array(playerSchema).max(MAX_PLAYERS),
  createdAt: timestampSchema,
}).strict()

const playerPatchSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  avatarId: z.number().int().min(0).max(AVATAR_COUNT - 1).optional(),
  animalId: z.number().int().min(0).max(ANIMAL_COUNT - 1).optional(),
  ready: z.boolean().optional(),
  connected: z.boolean().optional(),
}).strict()

/* ------------------------------- client -> server ------------------------------- */

export const clientMessageSchema = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('setReady'),
    ready: z.boolean(),
  }).strict(),
  z.object({
    t: z.literal('setGameMode'),
    mode: gameModeSchema,
  }).strict(),
  z.object({
    t: z.literal('updateProfile'),
    name: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
    avatarId: z.number().int().min(0).max(AVATAR_COUNT - 1).optional(),
    animalId: z.number().int().min(0).max(ANIMAL_COUNT - 1).optional(),
  }).strict(),
  z.object({ t: z.literal('startMatch') }).strict(),
  z.object({ t: z.literal('leave') }).strict(),
  z.object({ t: z.literal('ping') }).strict(),
])

export type ClientMessage = z.infer<typeof clientMessageSchema>
export type ClientMessageType = ClientMessage['t']

export type SetReadyMessage = Extract<ClientMessage, { t: 'setReady' }>
export type SetGameModeMessage = Extract<ClientMessage, { t: 'setGameMode' }>
export type UpdateProfileMessage = Extract<ClientMessage, { t: 'updateProfile' }>
export type StartMatchMessage = Extract<ClientMessage, { t: 'startMatch' }>
export type LeaveMessage = Extract<ClientMessage, { t: 'leave' }>
export type PingMessage = Extract<ClientMessage, { t: 'ping' }>

/* ------------------------------- server -> client ------------------------------- */

export const ROOM_ERROR_CODES = [
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'NOT_HOST',
  'NOT_READY',
  'MATCH_STARTED',
  'BAD_MESSAGE',
  'RATE_LIMITED',
] as const

export const roomErrorCodeSchema = z.enum(ROOM_ERROR_CODES)

export const serverMessageSchema = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('roomState'),
    room: roomStateSchema,
    selfId: idSchema,
  }).strict(),
  z.object({
    t: z.literal('playerJoined'),
    player: playerSchema,
  }).strict(),
  z.object({
    t: z.literal('playerLeft'),
    playerId: idSchema,
    hostId: idSchema.nullable(),
  }).strict(),
  z.object({
    t: z.literal('playerUpdated'),
    playerId: idSchema,
    patch: playerPatchSchema,
  }).strict(),
  z.object({
    t: z.literal('gameModeChanged'),
    mode: gameModeSchema,
    byPlayerId: idSchema,
  }).strict(),
  z.object({
    t: z.literal('hostChanged'),
    hostId: idSchema,
  }).strict(),
  z.object({
    t: z.literal('matchStarting'),
    mode: gameModeSchema,
    tries: z.number().int().positive(),
    playerCount: z.number().int().min(1).max(MAX_PLAYERS),
    startsAt: timestampSchema,
  }).strict(),
  z.object({
    t: z.literal('error'),
    code: roomErrorCodeSchema,
    message: z.string().min(1),
  }).strict(),
  z.object({ t: z.literal('pong') }).strict(),
])

export type ServerMessage = z.infer<typeof serverMessageSchema>
export type ServerMessageType = ServerMessage['t']
export type RoomErrorCode = z.infer<typeof roomErrorCodeSchema>

export type RoomStateMessage = Extract<ServerMessage, { t: 'roomState' }>
export type PlayerJoinedMessage = Extract<ServerMessage, { t: 'playerJoined' }>
export type PlayerLeftMessage = Extract<ServerMessage, { t: 'playerLeft' }>
export type PlayerUpdatedMessage = Extract<ServerMessage, { t: 'playerUpdated' }>
export type GameModeChangedMessage = Extract<ServerMessage, { t: 'gameModeChanged' }>
export type HostChangedMessage = Extract<ServerMessage, { t: 'hostChanged' }>
export type MatchStartingMessage = Extract<ServerMessage, { t: 'matchStarting' }>
export type ErrorMessage = Extract<ServerMessage, { t: 'error' }>
export type PongMessage = Extract<ServerMessage, { t: 'pong' }>

function parseFrame(frame: unknown): unknown {
  if (typeof frame === 'string') return JSON.parse(frame)

  if (frame instanceof ArrayBuffer) {
    return JSON.parse(new TextDecoder().decode(frame))
  }

  if (ArrayBuffer.isView(frame)) {
    return JSON.parse(new TextDecoder().decode(frame))
  }

  return frame
}

export function parseClientMessage(frame: unknown): ClientMessage {
  return clientMessageSchema.parse(parseFrame(frame))
}

export function parseServerMessage(frame: unknown): ServerMessage {
  return serverMessageSchema.parse(parseFrame(frame))
}

export function serializeClientMessage(message: ClientMessage): string {
  return JSON.stringify(clientMessageSchema.parse(message))
}

export function serializeServerMessage(message: ServerMessage): string {
  return JSON.stringify(serverMessageSchema.parse(message))
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled protocol value: ${JSON.stringify(value)}`)
}
