import {
  SignJWT,
  jwtVerify,
} from 'jose'

import {
  ANIMAL_COUNT,
  AVATAR_COUNT,
  MAX_NAME_LENGTH,
} from '@wordle-clash/shared'

const TICKET_ALGORITHM = 'HS256'
const TICKET_AUDIENCE = 'wordle-clash-room'
const TICKET_ISSUER = 'wordle-clash'

export const REALTIME_TICKET_TTL_SECONDS = 60

export interface RealtimeTicketIdentity {
  userId: string
  name: string
  avatarId: number
  animalId: number
  isAnonymous: boolean
}

function ticketKey(secret: string): Uint8Array {
  if (secret.length < 32) {
    throw new Error('RT_TICKET_SECRET must contain at least 32 characters')
  }

  return new TextEncoder().encode(secret)
}

function assertClaims(payload: Record<string, unknown>): RealtimeTicketIdentity {
  const {
    sub,
    name,
    avatarId,
    animalId,
    isAnon,
    exp,
  } = payload

  if (typeof sub !== 'string' || sub.length === 0) {
    throw new Error('Realtime ticket is missing a subject')
  }

  if (typeof name !== 'string' || name.length === 0 || name.length > MAX_NAME_LENGTH) {
    throw new Error('Realtime ticket contains an invalid name')
  }

  if (
    typeof avatarId !== 'number' ||
    !Number.isInteger(avatarId) ||
    avatarId < 0 ||
    avatarId >= AVATAR_COUNT
  ) {
    throw new Error('Realtime ticket contains an invalid avatar')
  }

  if (
    typeof animalId !== 'number' ||
    !Number.isInteger(animalId) ||
    animalId < 0 ||
    animalId >= ANIMAL_COUNT
  ) {
    throw new Error('Realtime ticket contains an invalid animal')
  }

  if (typeof isAnon !== 'boolean' || typeof exp !== 'number') {
    throw new Error('Realtime ticket contains invalid claims')
  }

  return {
    userId: sub,
    name,
    avatarId,
    animalId,
    isAnonymous: isAnon,
  }
}

export async function signRealtimeTicket(
  identity: RealtimeTicketIdentity,
  secret: string,
  now = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000)

  return new SignJWT({
    name: identity.name,
    avatarId: identity.avatarId,
    animalId: identity.animalId,
    isAnon: identity.isAnonymous,
  })
    .setProtectedHeader({ alg: TICKET_ALGORITHM, typ: 'JWT' })
    .setSubject(identity.userId)
    .setIssuer(TICKET_ISSUER)
    .setAudience(TICKET_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + REALTIME_TICKET_TTL_SECONDS)
    .sign(ticketKey(secret))
}

export async function verifyRealtimeTicket(
  ticket: string,
  secret: string,
  now = new Date(),
): Promise<RealtimeTicketIdentity> {
  const { payload } = await jwtVerify(ticket, ticketKey(secret), {
    algorithms: [TICKET_ALGORITHM],
    audience: TICKET_AUDIENCE,
    issuer: TICKET_ISSUER,
    currentDate: now,
  })

  return assertClaims(payload)
}
