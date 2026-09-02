import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { IdentityContext } from './identity-context'
import type { IdentityContextValue } from './identity-context'
import {
  ensureIdentity,
  INITIAL_IDENTITY_STATE,
  refreshIdentity,
  type IdentityState,
} from './identity'

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<IdentityState>(INITIAL_IDENTITY_STATE)

  const refresh = useCallback(async () => {
    const result = await refreshIdentity()
    setIdentity({
      ...result,
      status: 'ready',
      error: null,
    })
    return result
  }, [])

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

  const identityContextValue = useMemo<IdentityContextValue>(
    () => ({ ...identity, refreshIdentity: refresh }),
    [identity, refresh],
  )

  return (
    <IdentityContext.Provider value={identityContextValue}>
      {children}
    </IdentityContext.Provider>
  )
}
