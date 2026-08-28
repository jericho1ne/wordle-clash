import { useEffect } from 'react'
import { useParams } from 'react-router'

import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { useFavorites } from '../../identity'
import { useRoomStore } from '../../realtime'
import { Button } from '../../ui'
import styles from './LobbyScreen.module.scss'

const CONNECTION_LABELS = {
  idle: 'Waiting for a valid room code',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  terminal: 'Unable to join room',
}

/**
 * SCAFFOLD PLACEHOLDER. Invite/copy actions land in epic 05-room-invites. The
 * finished lobby (player list, ready states, game-mode toggle, favorite, start
 * dialog) lands in epic 06-lobby-screen on top of the realtime foundation.
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
  const connect = useRoomStore(({ connect }) => connect)
  const disconnect = useRoomStore(({ disconnect }) => disconnect)
  const connectionStatus = useRoomStore(({ status }) => status)
  const room = useRoomStore(({ room }) => room)
  const selfId = useRoomStore(({ selfId }) => selfId)
  const connectionError = useRoomStore(({ error }) => error)
  const setReady = useRoomStore(({ setReady }) => setReady)
  const self = room?.players.find(({ id }) => id === selfId)

  useEffect(() => {
    if (!validRoomCode) return

    connect(roomCode)
    return disconnect
  }, [connect, disconnect, roomCode, validRoomCode])

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
            {!room ? '' : ` · ${room.players.length} player${room.players.length === 1 ? '' : 's'}`}
          </div>
          {room && (
            <ul className={styles.players}>
              {room.players.map((player) => (
                <li key={player.id}>
                  {player.name}
                  {player.isHost ? ' · host' : ''}
                  {player.ready ? ' · ready' : ''}
                  {!player.connected ? ' · reconnecting' : ''}
                </li>
              ))}
            </ul>
          )}
          {self && (
            <Button
              variant={self.ready ? 'secondary' : 'primary'}
              aria-pressed={self.ready}
              onClick={() => setReady(!self.ready)}
            >
              {self.ready ? 'Not ready' : 'Ready up'}
            </Button>
          )}
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
              ? connectionError.message
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
