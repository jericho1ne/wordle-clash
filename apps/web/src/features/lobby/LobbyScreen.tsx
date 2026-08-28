import {
  useEffect,
  useState,
} from 'react'
import { useParams } from 'react-router'

import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { useFavorites } from '../../identity'
import { RoomSocket } from '../../realtime'
import { Button } from '../../ui'
import styles from './LobbyScreen.module.scss'

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'denied'

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  idle: 'Waiting for a valid room code',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  denied: 'Unable to join room',
}

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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!validRoomCode) return

    const socket = new RoomSocket(roomCode)
    let terminal = false
    const unsubscribe = [
      socket.on('open', () => setConnectionStatus('connected')),
      socket.on('close', () => {
        if (!terminal) setConnectionStatus('reconnecting')
      }),
      socket.on('roomState', ({ room }) => setPlayerCount(room.players.length)),
      socket.on('terminalError', ({ message }) => {
        terminal = true
        setConnectionStatus('denied')
        setConnectionError(message)
      }),
      socket.on('protocolError', ({ message }) => setConnectionError(message)),
    ]

    setConnectionStatus('connecting')
    socket.connect()

    return () => {
      terminal = true
      for (const removeListener of unsubscribe) removeListener()
      socket.disconnect()
    }
  }, [roomCode, validRoomCode])

  const toggleFavorite = () => {
    void toggle(roomCode).catch(() => undefined)
  }

  return (
    <div className={`app-stage ${styles.lobbyScreen}`}>
      <div className="app-stage__inner">
        <div className="card elev-md">
          <div className="card-kicker">Room code</div>
          <div className={`card-title ${styles.code}`}>{roomCode || '—'}</div>
          <div className={styles.connection}>
            Realtime: {CONNECTION_LABELS[connectionStatus]}
            {playerCount === null ? '' : ` · ${playerCount} player${playerCount === 1 ? '' : 's'}`}
          </div>
          <Button
            variant={favorite ? 'secondary' : 'ghost'}
            disabled={!validRoomCode}
            aria-pressed={favorite}
            onClick={toggleFavorite}
          >
            {favorite ? 'Favorited' : 'Favorite room'}
          </Button>
          <div className="card-meta">
            {connectionError
              ? connectionError
              : error
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
