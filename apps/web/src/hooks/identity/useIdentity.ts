import { useContext } from 'react'

import { IdentityContext } from '@/lib/identity/identity-context'
import type { IdentityContextValue } from '@/lib/identity/identity-context'

export function useIdentity(): IdentityContextValue {
  const identity = useContext(IdentityContext)

  if (!identity) {
    throw new Error('useIdentity must be used within IdentityProvider')
  }

  return identity
}
