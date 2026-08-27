import { useContext } from 'react'

import { IdentityContext } from './identity-context'
import type { IdentityState } from './identity'

export function useIdentity(): IdentityState {
  const identity = useContext(IdentityContext)

  if (!identity) {
    throw new Error('useIdentity must be used within IdentityProvider')
  }

  return identity
}
