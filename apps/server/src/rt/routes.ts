import {
  clampAnimalId,
  clampAvatarId,
} from '@wordle-clash/shared'

import { createAuth } from '../auth'
import {
  REALTIME_TICKET_TTL_SECONDS,
  signRealtimeTicket,
  verifyRealtimeTicket,
} from './ticket'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
}

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: NO_STORE_HEADERS,
    },
  )
}

export async function handleRealtimeTicket(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: 'POST',
        ...NO_STORE_HEADERS,
      },
    })
  }

  const session = await createAuth(request, env).api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return errorResponse(401, 'UNAUTHORIZED', 'An active guest session is required')
  }

  if (session.user.animalId === null || session.user.animalId === undefined) {
    return errorResponse(409, 'PROFILE_INCOMPLETE', 'Choose an animal avatar before joining a room')
  }

  const name = session.user.displayName?.trim() || session.user.name
  const ticket = await signRealtimeTicket(
    {
      userId: session.user.id,
      name,
      avatarId: clampAvatarId(session.user.avatarId ?? 0),
      animalId: clampAnimalId(session.user.animalId),
      isAnonymous: session.user.isAnonymous ?? false,
    },
    env.RT_TICKET_SECRET,
  )

  return Response.json(
    {
      ticket,
      expiresIn: REALTIME_TICKET_TTL_SECONDS,
    },
    { headers: NO_STORE_HEADERS },
  )
}

export async function authorizeWebSocketRequest(request: Request, env: Env): Promise<Request | Response> {
  const url = new URL(request.url)
  const ticket = url.searchParams.get('ticket')

  if (!ticket) {
    return errorResponse(401, 'INVALID_TICKET', 'A realtime ticket is required')
  }

  try {
    const identity = await verifyRealtimeTicket(ticket, env.RT_TICKET_SECRET)
    const headers = new Headers(request.headers)

    url.searchParams.delete('ticket')
    headers.delete('cookie')
    headers.set('x-user-id', identity.userId)
    headers.set('x-user-name', identity.name)
    headers.set('x-user-avatar', String(identity.avatarId))
    headers.set('x-user-animal', String(identity.animalId))
    headers.set('x-user-is-anonymous', String(identity.isAnonymous))

    return new Request(url, {
      method: request.method,
      headers,
    })
  } catch {
    return errorResponse(401, 'INVALID_TICKET', 'The realtime ticket is invalid or expired')
  }
}
