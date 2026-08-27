import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'
import {
  asc,
  and,
  eq,
} from 'drizzle-orm'

import { createAuth } from '../auth'
import { createDb } from '../db/client'
import { favoriteRooms } from '../db/schema'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
}

const MAX_MERGE_SIZE = 100

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: NO_STORE_HEADERS,
    },
  )
}

async function requireAccountUserId(request: Request, env: Env): Promise<string | Response> {
  const session = await createAuth(request, env).api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return errorResponse(401, 'UNAUTHORIZED', 'An active session is required')
  }

  if (session.user.isAnonymous) {
    return errorResponse(403, 'ACCOUNT_REQUIRED', 'Favorites sync requires a linked account')
  }

  return session.user.id
}

function parseRoomCode(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const roomCode = normalizeRoomCode(value)
  return isValidRoomCode(roomCode) ? roomCode : null
}

async function parseJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json()
    return value && typeof value === 'object'
      ? value as Record<string, unknown>
      : null
  }
  catch {
    return null
  }
}

async function listFavorites(env: Env, userId: string): Promise<string[]> {
  const rows = await createDb(env.DB)
    .select({ roomCode: favoriteRooms.roomCode })
    .from(favoriteRooms)
    .where(eq(favoriteRooms.userId, userId))
    .orderBy(asc(favoriteRooms.createdAt))

  return rows.map(({ roomCode }) => roomCode)
}

async function addFavorites(env: Env, userId: string, roomCodes: string[]): Promise<void> {
  if (roomCodes.length === 0) return

  await createDb(env.DB)
    .insert(favoriteRooms)
    .values(roomCodes.map((roomCode) => ({
      id: crypto.randomUUID(),
      userId,
      roomCode,
    })))
    .onConflictDoNothing()
}

async function handleGet(env: Env, userId: string): Promise<Response> {
  return Response.json(
    { roomCodes: await listFavorites(env, userId) },
    { headers: NO_STORE_HEADERS },
  )
}

async function handlePut(request: Request, env: Env, userId: string): Promise<Response> {
  const body = await parseJson(request)
  const roomCode = parseRoomCode(body?.roomCode)

  if (!roomCode) {
    return errorResponse(400, 'INVALID_ROOM_CODE', 'A valid room code is required')
  }

  await addFavorites(env, userId, [roomCode])
  return handleGet(env, userId)
}

async function handleDelete(request: Request, env: Env, userId: string): Promise<Response> {
  const body = await parseJson(request)
  const roomCode = parseRoomCode(body?.roomCode)

  if (!roomCode) {
    return errorResponse(400, 'INVALID_ROOM_CODE', 'A valid room code is required')
  }

  await createDb(env.DB)
    .delete(favoriteRooms)
    .where(and(
      eq(favoriteRooms.userId, userId),
      eq(favoriteRooms.roomCode, roomCode),
    ))

  return handleGet(env, userId)
}

async function handleMerge(request: Request, env: Env, userId: string): Promise<Response> {
  const body = await parseJson(request)
  const roomCodeValues = body?.roomCodes
  if (!Array.isArray(roomCodeValues) || roomCodeValues.length > MAX_MERGE_SIZE) {
    return errorResponse(400, 'INVALID_FAVORITES', 'A valid favorites list is required')
  }

  const roomCodes = [...new Set(roomCodeValues.map(parseRoomCode))]
  if (roomCodes.includes(null)) {
    return errorResponse(400, 'INVALID_ROOM_CODE', 'Every favorite must be a valid room code')
  }

  const validRoomCodes = roomCodes.filter((roomCode): roomCode is string => roomCode !== null)
  await addFavorites(env, userId, validRoomCodes)
  return handleGet(env, userId)
}

export async function handleFavorites(request: Request, env: Env): Promise<Response> {
  const userId = await requireAccountUserId(request, env)
  if (userId instanceof Response) return userId

  if (request.method === 'GET') return handleGet(env, userId)
  if (request.method === 'PUT') return handlePut(request, env, userId)
  if (request.method === 'DELETE') return handleDelete(request, env, userId)
  if (request.method === 'POST') return handleMerge(request, env, userId)

  return new Response(null, {
    status: 405,
    headers: {
      Allow: 'GET, PUT, DELETE, POST',
      ...NO_STORE_HEADERS,
    },
  })
}
