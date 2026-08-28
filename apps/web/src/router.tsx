import {
  createBrowserRouter,
  Navigate,
  useParams,
} from 'react-router'

import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { TitleScreen } from './features/title/TitleScreen'
import { SetupScreen } from './features/setup/SetupScreen'
import { LobbyScreen } from './features/lobby/LobbyScreen'
import { DesignSystem } from './features/dev/DesignSystem'
import { readStoredProfile } from './identity/profile'

function InviteRoomRoute() {
  const { code = '' } = useParams()
  const roomCode = normalizeRoomCode(code)
  const storedProfile = readStoredProfile()

  if (!isValidRoomCode(roomCode)) {
    return <Navigate to={`/setup?join=${encodeURIComponent(roomCode)}`} replace />
  }

  if (code !== roomCode) {
    return <Navigate to={`/room/${roomCode}`} replace />
  }

  if (!storedProfile || storedProfile.animalId === null) {
    return <Navigate to={`/setup?join=${encodeURIComponent(roomCode)}`} replace />
  }

  return <LobbyScreen />
}

/**
 * Routes (see docs/stories/00-app-scaffold/08-routing-react-router.md):
 *   /              title
 *   /setup         player setup + create/join room  (?join=<code> deep-link)
 *   /room/:code    invite-aware lobby entry
 *   /design-system design-system showcase (DEV builds only)
 *
 */
export const router = createBrowserRouter([
  { path: '/', element: <TitleScreen /> },
  { path: '/setup', element: <SetupScreen /> },
  { path: '/room/:code', element: <InviteRoomRoute /> },
  ...(import.meta.env.DEV ? [{ path: '/design-system', element: <DesignSystem /> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
])
