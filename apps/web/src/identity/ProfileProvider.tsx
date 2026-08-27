import type { Profile } from '@wordle-clash/shared'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { ProfileContext } from './profile-context'
import {
  EMPTY_PROFILE,
  mirrorProfile,
  normalizeProfile,
  readStoredProfile,
  reconcileProfile,
  writeStoredProfile,
} from './profile'

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [localProfile] = useState(readStoredProfile)
  const [profile, setProfileState] = useState(localProfile ?? EMPTY_PROFILE)
  const reconciliationPromise = useRef<Promise<Profile | null> | null>(null)

  useEffect(() => {
    let active = true
    reconciliationPromise.current ??= reconcileProfile(localProfile)

    void reconciliationPromise.current.then(
      (remoteProfile) => {
        if (active && remoteProfile && !readStoredProfile()) {
          writeStoredProfile(remoteProfile)
          setProfileState(remoteProfile)
        }
      },
      () => undefined,
    )

    return () => {
      active = false
    }
  }, [localProfile])

  const setProfile = useCallback(async (nextProfile: Profile) => {
    const normalizedProfile = normalizeProfile(nextProfile)
    if (!normalizedProfile.name) throw new Error('Profile name is required')

    writeStoredProfile(normalizedProfile)
    setProfileState(normalizedProfile)
    await mirrorProfile(normalizedProfile)
  }, [])

  const value = useMemo(() => ({
    profile,
    setProfile,
  }), [profile, setProfile])

  return <ProfileContext value={value}>{children}</ProfileContext>
}
