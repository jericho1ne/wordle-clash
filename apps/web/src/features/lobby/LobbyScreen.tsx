import { useParams } from 'react-router'

import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { useFavorites } from '../../identity'
import { Button } from '../../ui'
import styles from './LobbyScreen.module.scss'

/**
 * SCAFFOLD PLACEHOLDER. The RoomServer-backed lobby (player list, ready states,
 * game-mode toggle, favorite/copy, start dialog) lands in epic 06-lobby-screen,
 * on top of the realtime foundation (epic 02).
 */
export function LobbyScreen() {
  const { code } = useParams()
  const roomCode = normalizeRoomCode(code ?? '')
  const {
    error,
    isFavorite,
    toggle,
  } = useFavorites()
  const validRoomCode = isValidRoomCode(roomCode)
  const favorite = isFavorite(roomCode)

  const toggleFavorite = () => {
    void toggle(roomCode).catch(() => undefined)
  }

  return (
    <div className={`app-stage ${styles.lobbyScreen}`}>
      <div className="app-stage__inner">
        <div className="card elev-md">
          <div className="card-kicker">Room code</div>
          <div className={`card-title ${styles.code}`}>{roomCode || '—'}</div>
          <Button
            variant={favorite ? 'secondary' : 'ghost'}
            disabled={!validRoomCode}
            aria-pressed={favorite}
            onClick={toggleFavorite}
          >
            {favorite ? 'Favorited' : 'Favorite room'}
          </Button>
          <div className="card-meta">
            {error
              ? error.message
              : favorite
                ? 'Saved to your favorites.'
                : 'Scaffold placeholder — favorites slice is live.'}
          </div>
        </div>
      </div>
    </div>
  )
}
