import { getServerByName } from 'partyserver'

import { generateRoomCode } from '@wordle-clash/shared'

import { createAuth } from '../auth'

const MAX_RESERVATION_ATTEMPTS = 8
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

export async function handleCreateRoom(request: Request, env: Env): Promise<Response> {
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

  for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode()
    const room = await getServerByName(env.ROOM, roomCode)

    if (await room.reserve(session.user.id)) {
      return Response.json(
        { roomCode },
        {
          status: 201,
          headers: NO_STORE_HEADERS,
        },
      )
    }
  }

  return errorResponse(503, 'ROOM_CODE_UNAVAILABLE', 'Unable to reserve a room code')
}
