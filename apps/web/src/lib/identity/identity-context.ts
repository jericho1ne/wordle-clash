import { createContext } from 'react'

import type {
  Identity,
  IdentityState,
} from './identity'

export interface IdentityContextValue extends IdentityState {
  refreshIdentity: () => Promise<Identity>
}

export const IdentityContext = createContext<IdentityContextValue | null>(null)
