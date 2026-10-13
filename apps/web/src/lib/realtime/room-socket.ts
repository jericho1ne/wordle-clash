import PartySocket from 'partysocket'

import {
  isValidRoomCode,
  normalizeRoomCode,
  parseServerMessage,
  serializeClientMessage,
  type ClientMessage,
  type ErrorMessage,
  type ServerMessage,
} from '@wordle-clash/shared'

import { getRealtimeTicketQuery } from './ticket'

const TERMINAL_ROOM_ERROR_CODES = new Set<ErrorMessage['code']>([
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'MATCH_STARTED',
])

type MessageEvents = {
  [Message in ServerMessage as Message['t']]: Message
}

interface LifecycleEvents {
  open: Event
  close: CloseEvent
  socketError: Event
  protocolError: Error
  terminalError: ErrorMessage
}

export type RoomSocketEvents = MessageEvents & LifecycleEvents
export type RoomSocketEventType = keyof RoomSocketEvents
export type RoomSocketListener<Type extends RoomSocketEventType> = (
  event: RoomSocketEvents[Type],
) => void

export function isTerminalRoomError(message: ErrorMessage): boolean {
  return TERMINAL_ROOM_ERROR_CODES.has(message.code)
}

/** Ticket-authenticated, reconnecting socket with validated, typed protocol events. */
export class RoomSocket {
  readonly roomCode: string

  #socket: PartySocket
  #listeners = new Map<RoomSocketEventType, Set<(event: never) => void>>()

  constructor(roomCode: string) {
    this.roomCode = normalizeRoomCode(roomCode)
    if (!isValidRoomCode(this.roomCode)) throw new Error('A valid room code is required')

    this.#socket = new PartySocket({
      host: window.location.host,
      party: 'room',
      prefix: 'ws',
      protocol: window.location.protocol === 'https:' ? 'wss' : 'ws',
      room: this.roomCode,
      query: getRealtimeTicketQuery,
      startClosed: true,
      shouldReconnectOnClose: ({ code }) => code !== 1008,
    })

    this.#socket.addEventListener('open', (event) => this.#emit('open', event))
    this.#socket.addEventListener('close', (event) => this.#emit('close', event))
    this.#socket.addEventListener('error', (event) => this.#emit('socketError', event))
    this.#socket.addEventListener('message', (event) => this.#handleMessage(event))
  }

  get readyState(): number {
    return this.#socket.readyState
  }

  connect(): void {
    this.#socket.reconnect()
  }

  disconnect(): void {
    this.#socket.close(1000, 'Client disconnected')
  }

  send(message: ClientMessage): boolean {
    return this.#socket.send(serializeClientMessage(message))
  }

  on<Type extends RoomSocketEventType>(
    type: Type,
    listener: RoomSocketListener<Type>,
  ): () => void {
    const listeners = this.#listeners.get(type) ?? new Set()
    listeners.add(listener as (event: never) => void)
    this.#listeners.set(type, listeners)

    return () => listeners.delete(listener as (event: never) => void)
  }

  #handleMessage(event: MessageEvent): void {
    try {
      const message = parseServerMessage(event.data)
      this.#emit(message.t, message)

      if (message.t === 'error' && isTerminalRoomError(message)) {
        this.#emit('terminalError', message)
        this.#socket.close(1008, message.message)
      }
    } catch (error: unknown) {
      this.#emit(
        'protocolError',
        error instanceof Error ? error : new Error('Unable to parse realtime message'),
      )
    }
  }

  #emit<Type extends RoomSocketEventType>(
    type: Type,
    event: RoomSocketEvents[Type],
  ): void {
    for (const listener of this.#listeners.get(type) ?? []) {
      listener(event as never)
    }
  }
}
