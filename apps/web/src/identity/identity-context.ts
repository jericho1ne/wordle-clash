import { createContext } from 'react'

import type { IdentityState } from './identity'

export const IdentityContext = createContext<IdentityState | null>(null)
