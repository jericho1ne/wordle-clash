import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router'

import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { useFavorites } from '../../identity'
import { useRoomStore } from '../../realtime'
import {
  Avatar,
  Button,
} from '../../ui'
import {
  copyRoomCode,
  shareRoomInvite,
} from './invite'
import { LobbyMusic } from './LobbyMusic'
import styles from './LobbyScreen.module.scss'

type Feedback = 'code' | 'invite' | null

const CONNECTION_LABELS = {
  idle: 'Waiting for a valid room code',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  terminal: 'Unable to join room',
}

/** Invite-ready room shell. The finished lobby controls land in epic 06. */
export function LobbyScreen() {
  const { code } = useParams()
  const navigate = useNavigate()
  const roomCode = normalizeRoomCode(code ?? '')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const feedbackTimeout = useRef<number | null>(null)
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

  useEffect(() => () => {
    if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
  }, [])

  const showFeedback = (action: Exclude<Feedback, null>) => {
    if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
    setFeedback(action)
    setActionError(null)
    feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 2_000)
  }

  const runClipboardAction = async (
    action: Exclude<Feedback, null>,
    callback: () => Promise<unknown>,
  ) => {
    try {
      await callback()
      showFeedback(action)
    } catch (cause: unknown) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setActionError(cause instanceof Error ? cause.message : 'Unable to share the room')
    }
  }

  const toggleFavorite = () => {
    void toggle(roomCode).catch(() => undefined)
  }

  return (
    <div className={`app-stage ${styles.lobbyScreen}`}>
      <div className="app-stage__inner">
        <div className="card elev-md">
          <div className="card-kicker">Room code</div>
          <div className={`card-title ${styles.code}`}>{roomCode || '—'}</div>
          <div className={styles.inviteActions}>
            <Button
              disabled={!validRoomCode || connectionStatus === 'terminal'}
              onClick={() => void runClipboardAction(
                'invite',
                () => shareRoomInvite(window.location.origin, roomCode),
              )}
            >
              {feedback === 'invite' ? '✓ Invite ready' : 'Invite friends'}
            </Button>
            <Button
              variant="secondary"
              disabled={!validRoomCode}
              onClick={() => void runClipboardAction(
                'code',
                () => copyRoomCode(roomCode),
              )}
            >
              {feedback === 'code' ? '✓ Code copied' : 'Copy code'}
            </Button>
          </div>
          <p className={styles.feedback} aria-live="polite">
            {actionError ?? (feedback === 'invite'
              ? 'The room invitation is ready to send.'
              : feedback === 'code' ? 'Room code copied to your clipboard.' : '')}
          </p>
          <div className={styles.connection}>
            Realtime: {CONNECTION_LABELS[connectionStatus]}
            {!room ? '' : ` · ${room.players.length} player${room.players.length === 1 ? '' : 's'}`}
          </div>
          {room && (
            <ul className={styles.players}>
              {room.players.map((player) => (
                <li key={player.id}>
                  <Avatar avatarId={player.avatarId} animalId={player.animalId} />
                  <span className={styles.playerDetails}>
                    <span className={styles.playerName}>{player.name}</span>
                    <span className={styles.playerStatus}>
                      {player.isHost ? 'Host' : 'Player'}
                      {player.ready ? ' · Ready' : ''}
                      {!player.connected ? ' · Reconnecting' : ''}
                    </span>
                  </span>
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
              {self.ready ? 'Not ready' : 'I\'m Ready'}
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
          {connectionStatus === 'terminal' && (
            <Button variant="secondary" onClick={() => navigate('/setup')}>
              Back to room setup
            </Button>
          )}
        </div>
      </div>
      <LobbyMusic />
    </div>
  )
}
