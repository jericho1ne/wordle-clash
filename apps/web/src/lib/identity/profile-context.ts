import type { Profile } from '@wordle-clash/shared'
import { createContext } from 'react'

export interface ProfileContextValue {
  profile: Profile
  setProfile: (profile: Profile) => Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
