import { use } from 'react'

import { FavoritesContext } from './favorites-context'

export function useFavorites() {
  const context = use(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
