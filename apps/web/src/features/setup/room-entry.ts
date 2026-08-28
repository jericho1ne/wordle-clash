import {
  isValidRoomCode,
  normalizeRoomCode,
  type ErrorMessage,
} from '@wordle-clash/shared'

import { RoomSocket } from '../../realtime'

interface CreateRoomResponse {
  roomCode?: unknown
  error?: { message?: unknown }
}

const JOIN_ERROR_MESSAGES: Partial<Record<ErrorMessage['code'], string>> = {
  ROOM_NOT_FOUND: 'This room no longer exists. Ask the host for a new invitation.',
  ROOM_FULL: 'This room is full. Ask the host to create another room.',
  MATCH_STARTED: 'This match has already started. Ask the host for the next room.',
}

function responseError(body: CreateRoomResponse, status: number): Error {
  const message = body.error?.message
  return new Error(typeof message === 'string' ? message : `Unable to create room (${status})`)
}

export async function createRoom(): Promise<string> {
  const response = await fetch('/api/rooms', { method: 'POST' })
  const body = await response.json() as CreateRoomResponse
  if (!response.ok) throw responseError(body, response.status)

  const roomCode = typeof body.roomCode === 'string'
    ? normalizeRoomCode(body.roomCode)
    : ''
  if (!isValidRoomCode(roomCode)) throw new Error('Create room response is malformed')

  return roomCode
}

/**
 * Join once to validate the authoritative room boundary before navigation.
 * Lobby reconnects the same identity immediately, inside the disconnect grace.
 */
export function verifyRoomJoin(roomCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new RoomSocket(roomCode)
    const removeListeners: (() => void)[] = []
    let settled = false
    let timeoutId = 0

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      for (const removeListener of removeListeners) removeListener()
      socket.disconnect()
      callback()
    }

    timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('The room took too long to respond')))
    }, 10_000)

    removeListeners.push(
      socket.on('roomState', () => finish(() => resolve())),
      socket.on('terminalError', ({ code, message }) => {
        finish(() => reject(new Error(JOIN_ERROR_MESSAGES[code] ?? message)))
      }),
      socket.on('protocolError', (error) => finish(() => reject(error))),
    )

    socket.connect()
  })
}
