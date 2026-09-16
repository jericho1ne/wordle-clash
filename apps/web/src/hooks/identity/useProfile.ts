import { use } from 'react'

import { ProfileContext } from '@/lib/identity/profile-context'

export function useProfile() {
  const context = use(ProfileContext)
  if (!context) throw new Error('useProfile must be used within ProfileProvider')
  return context
}
