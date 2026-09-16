import { authClient } from './auth-client'

export interface Identity {
  userId: string
  isAnonymous: boolean
}

export type IdentityStatus = 'initializing' | 'ready' | 'error'

export interface IdentityState {
  userId: string | null
  isAnonymous: boolean
  status: IdentityStatus
  error: Error | null
}

export const INITIAL_IDENTITY_STATE: IdentityState = {
  userId: null,
  isAnonymous: false,
  status: 'initializing',
  error: null,
}

let identityPromise: Promise<Identity> | null = null

function authError(message: string, error: { message?: string } | null): Error {
  return new Error(error?.message ?? message)
}

async function loadIdentity(): Promise<Identity> {
  const sessionResult = await authClient.getSession()

  if (sessionResult.error) {
    throw authError('Unable to restore guest identity', sessionResult.error)
  }

  if (sessionResult.data?.user) {
    return {
      userId: sessionResult.data.user.id,
      isAnonymous: sessionResult.data.user.isAnonymous ?? false,
    }
  }

  const signInResult = await authClient.signIn.anonymous()

  if (signInResult.error || !signInResult.data?.user) {
    throw authError('Unable to create guest identity', signInResult.error)
  }

  return {
    userId: signInResult.data.user.id,
    isAnonymous: signInResult.data.user.isAnonymous ?? true,
  }
}

/** Restore or mint the invisible identity required before opening a socket. */
export function ensureIdentity(): Promise<Identity> {
  identityPromise ??= loadIdentity().catch((error: unknown) => {
    identityPromise = null
    throw error
  })

  return identityPromise
}

/** Reload identity after an account sign-in, sign-up, or account link. */
export function refreshIdentity(): Promise<Identity> {
  identityPromise = null
  return ensureIdentity()
}
