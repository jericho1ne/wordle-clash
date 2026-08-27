import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  clearStoredFavorites,
  getAccountFavorites,
  mergeAccountFavorites,
  readStoredFavorites,
  setAccountFavorite,
  writeStoredFavorites,
} from './favorites'
import {
  FavoritesContext,
  type FavoritesStatus,
} from './favorites-context'
import { useIdentity } from './useIdentity'

interface AccountSync {
  userId: string
  promise: Promise<string[]>
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const identity = useIdentity()
  const [favorites, setFavorites] = useState(readStoredFavorites)
  const [status, setStatus] = useState<FavoritesStatus>('local')
  const [error, setError] = useState<Error | null>(null)
  const accountSync = useRef<AccountSync | null>(null)

  useEffect(() => {
    if (identity.status !== 'ready') return

    if (identity.isAnonymous || !identity.userId) {
      return
    }

    let active = true
    let sync = accountSync.current
    if (sync?.userId !== identity.userId) {
      const localFavorites = readStoredFavorites()
      sync = {
        userId: identity.userId,
        promise: localFavorites.length > 0
          ? mergeAccountFavorites(localFavorites)
          : getAccountFavorites(),
      }
      accountSync.current = sync
    }

    void sync.promise.then(
      (accountFavorites) => {
        clearStoredFavorites()
        if (!active) return

        setFavorites(accountFavorites)
        setStatus('ready')
        setError(null)
      },
      (syncError: unknown) => {
        if (!active) return

        setStatus('error')
        setError(syncError instanceof Error
          ? syncError
          : new Error('Unable to sync favorites'))
      },
    )

    return () => {
      active = false
    }
  }, [identity.isAnonymous, identity.status, identity.userId])

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  const isFavorite = useCallback((roomCode: string) => (
    favoriteSet.has(normalizeRoomCode(roomCode))
  ), [favoriteSet])

  const toggle = useCallback(async (value: string) => {
    const roomCode = normalizeRoomCode(value)
    if (!isValidRoomCode(roomCode)) throw new Error('A valid room code is required')

    const wasFavorite = favoriteSet.has(roomCode)
    const nextFavorites = wasFavorite
      ? favorites.filter((favorite) => favorite !== roomCode)
      : [...favorites, roomCode]

    setFavorites(nextFavorites)
    setError(null)

    const useLocalFavorites = identity.status !== 'ready' || identity.isAnonymous
    if (useLocalFavorites) {
      writeStoredFavorites(nextFavorites)
      return !wasFavorite
    }

    try {
      const accountFavorites = await setAccountFavorite(roomCode, !wasFavorite)
      setFavorites(accountFavorites)
      setStatus('ready')
      return !wasFavorite
    }
    catch (toggleError) {
      setFavorites(favorites)
      setStatus('error')
      setError(toggleError instanceof Error
        ? toggleError
        : new Error('Unable to update favorite'))
      throw toggleError
    }
  }, [favoriteSet, favorites, identity.isAnonymous, identity.status])

  const effectiveStatus: FavoritesStatus =
    identity.status === 'ready' && !identity.isAnonymous && status === 'local'
      ? 'loading'
      : status

  const value = useMemo(() => ({
    favorites,
    status: effectiveStatus,
    error,
    isFavorite,
    toggle,
  }), [effectiveStatus, error, favorites, isFavorite, toggle])

  return <FavoritesContext value={value}>{children}</FavoritesContext>
}
