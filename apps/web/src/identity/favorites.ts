import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

export const FAVORITES_STORAGE_KEY = 'wc.favorites'

interface FavoritesResponse {
  roomCodes: string[]
}

function normalizeFavorite(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const roomCode = normalizeRoomCode(value)
  return isValidRoomCode(roomCode) ? roomCode : null
}

function normalizeFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return [...new Set(value
    .map(normalizeFavorite)
    .filter((roomCode): roomCode is string => roomCode !== null))]
}

export function readStoredFavorites(): string[] {
  if (typeof window === 'undefined') return []

  try {
    return normalizeFavorites(JSON.parse(
      window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]',
    ))
  }
  catch {
    return []
  }
}

export function writeStoredFavorites(roomCodes: readonly string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(roomCodes))
}

export function clearStoredFavorites(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
}

async function requestFavorites(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: Record<string, unknown>,
): Promise<string[]> {
  const response = await fetch('/api/favorites', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const result: unknown = await response.json()
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result
      ? (result.error as { message?: string })?.message
      : undefined

    throw new Error(message ?? 'Unable to sync favorites')
  }

  if (!result || typeof result !== 'object' || !('roomCodes' in result)) {
    throw new Error('Favorites response is invalid')
  }

  return normalizeFavorites((result as FavoritesResponse).roomCodes)
}

export function getAccountFavorites(): Promise<string[]> {
  return requestFavorites('GET')
}

export function mergeAccountFavorites(roomCodes: readonly string[]): Promise<string[]> {
  return requestFavorites('POST', { roomCodes })
}

export function setAccountFavorite(roomCode: string, favorite: boolean): Promise<string[]> {
  return requestFavorites(favorite ? 'PUT' : 'DELETE', { roomCode })
}
