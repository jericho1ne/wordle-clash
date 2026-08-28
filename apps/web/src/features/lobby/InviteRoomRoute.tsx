import {
  Navigate,
  useParams,
} from 'react-router'

import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { readStoredProfile } from '../../identity/profile'
import { LobbyScreen } from './LobbyScreen'

export function InviteRoomRoute() {
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
