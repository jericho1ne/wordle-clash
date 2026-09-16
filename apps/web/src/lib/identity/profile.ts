import {
  clampAnimalId,
  clampAvatarId,
  MAX_NAME_LENGTH,
  type Profile,
} from '@wordle-clash/shared'

import { authClient } from './auth-client'
import { ensureIdentity } from './identity'

export const PROFILE_STORAGE_KEY = 'wc.profile'

export const EMPTY_PROFILE: Profile = {
  name: '',
  avatarId: 0,
  animalId: null,
}

function authError(message: string, error: { message?: string } | null): Error {
  return new Error(error?.message ?? message)
}

export function normalizeProfile(profile: Profile): Profile {
  return {
    name: profile.name.trim().slice(0, MAX_NAME_LENGTH),
    avatarId: clampAvatarId(profile.avatarId),
    animalId: profile.animalId === null ? null : clampAnimalId(profile.animalId),
  }
}

function profileFromUnknown(value: unknown): Profile | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Record<string, unknown>
  if (typeof candidate.name !== 'string' || typeof candidate.avatarId !== 'number') return null

  const profile = normalizeProfile({
    name: candidate.name,
    avatarId: candidate.avatarId,
    animalId: typeof candidate.animalId === 'number' ? candidate.animalId : null,
  })

  return profile.name ? profile : null
}

export function readStoredProfile(): Profile | null {
  if (typeof window === 'undefined') return null

  try {
    return profileFromUnknown(JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? 'null'))
  } catch {
    return null
  }
}

export function writeStoredProfile(profile: Profile): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

function profileFromUser(user: {
  displayName?: string | null
  avatarId?: number | null
  animalId?: number | null
}): Profile | null {
  return profileFromUnknown({
    name: user.displayName,
    avatarId: user.avatarId,
    animalId: user.animalId ?? null,
  })
}

function profilesMatch(left: Profile | null, right: Profile): boolean {
  return left?.name === right.name &&
    left.avatarId === right.avatarId &&
    left.animalId === right.animalId
}

export async function mirrorProfile(profile: Profile): Promise<void> {
  await ensureIdentity()
  if (profile.animalId === null) throw new Error('Animal avatar is required')

  const result = await authClient.updateUser({
    displayName: profile.name,
    avatarId: profile.avatarId,
    animalId: profile.animalId,
  })

  if (result.error) {
    throw authError('Unable to sync profile', result.error)
  }
}

/** Prefer the local profile, falling back to a profile already stored on the user. */
export async function reconcileProfile(localProfile: Profile | null): Promise<Profile | null> {
  await ensureIdentity()

  const sessionResult = await authClient.getSession()
  if (sessionResult.error) {
    throw authError('Unable to restore profile', sessionResult.error)
  }

  const remoteProfile = sessionResult.data?.user
    ? profileFromUser(sessionResult.data.user)
    : null

  if (localProfile) {
    if (!profilesMatch(remoteProfile, localProfile)) {
      await mirrorProfile(localProfile)
    }

    return null
  }

  return remoteProfile
}
