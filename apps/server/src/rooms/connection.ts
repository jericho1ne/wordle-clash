import type { Connection } from 'partyserver'

import {
  ANIMAL_COUNT,
  AVATAR_COUNT,
  MAX_NAME_LENGTH,
} from '@wordle-clash/shared'

export interface ConnectionIdentity {
  userId: string
  name: string
  avatarId: number
  animalId: number
  isAnonymous: boolean
}

export interface RoomConnectionState {
  userId: string
  isAnonymous: boolean
}

export function userConnectionTag(userId: string): string {
  return `user:${userId}`
}

export function parseConnectionIdentity(request: Request): ConnectionIdentity {
  const userId = request.headers.get('x-user-id')?.trim()
  const name = request.headers.get('x-user-name')?.trim().slice(0, MAX_NAME_LENGTH)
  const avatarValue = request.headers.get('x-user-avatar')
  const animalValue = request.headers.get('x-user-animal')
  const isAnonymousValue = request.headers.get('x-user-is-anonymous')
  const avatarId = avatarValue?.trim()
    ? Number(avatarValue)
    : Number.NaN
  const animalId = animalValue?.trim()
    ? Number(animalValue)
    : Number.NaN

  if (
    !userId ||
    !name ||
    !Number.isInteger(avatarId) ||
    avatarId < 0 ||
    avatarId >= AVATAR_COUNT
  ) {
    throw new Error('Trusted connection identity headers are missing or invalid')
  }

  if (
    !Number.isInteger(animalId) ||
    animalId < 0 ||
    animalId >= ANIMAL_COUNT
  ) {
    throw new Error('Trusted animal identity header is missing or invalid')
  }

  if (isAnonymousValue !== 'true' && isAnonymousValue !== 'false') {
    throw new Error('Trusted anonymous identity header is missing or invalid')
  }

  return {
    userId,
    name,
    avatarId,
    animalId,
    isAnonymous: isAnonymousValue === 'true',
  }
}

export function getConnectionState(connection: Connection): RoomConnectionState | null {
  const state = connection.state
  if (!state || typeof state !== 'object') return null

  const candidate = state as Record<string, unknown>
  return typeof candidate.userId === 'string' && typeof candidate.isAnonymous === 'boolean'
    ? {
        userId: candidate.userId,
        isAnonymous: candidate.isAnonymous,
      }
    : null
}
