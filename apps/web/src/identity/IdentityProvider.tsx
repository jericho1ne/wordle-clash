import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { IdentityContext } from './identity-context'
import {
  ensureIdentity,
  INITIAL_IDENTITY_STATE,
  type IdentityState,
} from './identity'

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<IdentityState>(INITIAL_IDENTITY_STATE)

  useEffect(() => {
    let active = true

    void ensureIdentity().then(
      (result) => {
        if (!active) return

        setIdentity({
          ...result,
          status: 'ready',
          error: null,
        })
      },
      (error: unknown) => {
        if (!active) return

        setIdentity({
          ...INITIAL_IDENTITY_STATE,
          status: 'error',
          error: error instanceof Error ? error : new Error('Unable to initialize identity'),
        })
      },
    )

    return () => {
      active = false
    }
  }, [])

  return <IdentityContext value={identity}>{children}</IdentityContext>
}
