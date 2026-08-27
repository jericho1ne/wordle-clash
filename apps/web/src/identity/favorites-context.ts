import { createContext } from 'react'

export type FavoritesStatus = 'local' | 'loading' | 'ready' | 'error'

export interface FavoritesContextValue {
  favorites: readonly string[]
  status: FavoritesStatus
  error: Error | null
  isFavorite: (roomCode: string) => boolean
  toggle: (roomCode: string) => Promise<boolean>
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null)
