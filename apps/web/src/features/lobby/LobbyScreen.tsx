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
  canStartMatch,
  GAME_MODES,
  GAME_MODE_IDS,
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'
import { Star } from '@phosphor-icons/react'

import { useFavorites } from '../../identity'
import { useRoomStore } from '../../realtime'
import {
  Avatar,
  Button,
  Dialog,
  IconButton,
  SegmentedControl,
  Tag,
  useToast,
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
  const feedbackTimeout = useRef<number | null>(null)
  const knownPlayerIds = useRef<Set<string> | null>(null)
  const { showToast } = useToast()
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
  const setGameMode = useRoomStore(({ setGameMode }) => setGameMode)
  const startMatch = useRoomStore(({ startMatch }) => startMatch)
  const matchStarting = useRoomStore(({ matchStarting }) => matchStarting)
  const dismissMatchStarting = useRoomStore(
    ({ dismissMatchStarting }) => dismissMatchStarting,
  )
  const self = room?.players.find(({ id }) => id === selfId)
  const canStart = room ? canStartMatch(room) : false
  const startHint = !room || room.players.length < 2
    ? 'At least two players are required.'
    : room.players.some(({ ready }) => !ready)
      ? 'Every player must be ready.'
      : 'Everyone is ready to clash.'

  useEffect(() => {
    if (!validRoomCode) return

    connect(roomCode)
    return disconnect
  }, [connect, disconnect, roomCode, validRoomCode])

  useEffect(() => {
    if (!matchStarting) return
    const delay = Math.max(0, matchStarting.startsAt - Date.now())
    const timeout = window.setTimeout(() => navigate(`/room/${roomCode}/play`), delay)
    return () => window.clearTimeout(timeout)
  }, [matchStarting, navigate, roomCode])

  useEffect(() => {
    if (room?.phase === 'playing' || room?.phase === 'finished') {
      navigate(`/room/${roomCode}/play`, { replace: true })
    }
  }, [navigate, room?.phase, roomCode])

  useEffect(() => () => {
    if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
  }, [])

  useEffect(() => {
    if (!room) {
      knownPlayerIds.current = null
      return
    }

    const currentIds = new Set(room.players.map(({ id }) => id))
    if (knownPlayerIds.current) {
      for (const player of room.players) {
        if (!knownPlayerIds.current.has(player.id) && player.id !== selfId) {
          showToast(`${player.name} joined the lobby`)
        }
      }
    }
    knownPlayerIds.current = currentIds
  }, [room, selfId, showToast])

  const showFeedback = (action: Exclude<Feedback, null>) => {
    if (feedbackTimeout.current !== null) window.clearTimeout(feedbackTimeout.current)
    setFeedback(action)
    feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 2_000)
  }

  const runClipboardAction = async (
    action: Exclude<Feedback, null>,
    callback: () => Promise<unknown>,
  ) => {
    try {
      await callback()
      showFeedback(action)
      showToast(action === 'invite' ? 'Room invitation ready' : 'Room code copied')
    } catch (cause: unknown) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      showToast(cause instanceof Error ? cause.message : 'Unable to share the room')
    }
  }

  const toggleFavorite = async () => {
    try {
      const nextFavorite = await toggle(roomCode)
      showToast(nextFavorite ? 'Room added to favorites' : 'Room removed from favorites')
    } catch (cause: unknown) {
      showToast(cause instanceof Error ? cause.message : 'Unable to update favorite')
    }
  }

  return (
    <div className={`app-stage ${styles.lobbyScreen}`}>
      <div className="app-stage__inner">
        <div className="card elev-md">
          <div className={styles.roomHeader}>
            <div>
              <div className="card-kicker">Room code</div>
              <div className={`card-title ${styles.code}`}>{roomCode || '—'}</div>
            </div>
            <IconButton
              variant={favorite ? 'secondary' : 'ghost'}
              aria-label={favorite ? 'Remove room from favorites' : 'Add room to favorites'}
              aria-pressed={favorite}
              disabled={!validRoomCode}
              onClick={() => void toggleFavorite()}
            >
              <Star aria-hidden="true" weight={favorite ? 'fill' : 'regular'} />
            </IconButton>
          </div>
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
          <div
            className={styles.connection}
            data-status={connectionStatus}
            role="status"
          >
            {CONNECTION_LABELS[connectionStatus]}
          </div>
          {room && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>Game mode</div>
              <SegmentedControl
                name="game-mode"
                aria-label="Game mode"
                value={room.gameMode}
                disabled={!self?.isHost || room.phase !== 'lobby'}
                onChange={setGameMode}
                options={GAME_MODE_IDS.map((mode) => ({
                  value: mode,
                  label: GAME_MODES[mode].label,
                }))}
              />
              <p className={styles.modeDescription}>{GAME_MODES[room.gameMode].description}</p>
            </section>
          )}
          {room && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>Players · {room.players.length}</div>
              <ul className={styles.players}>
                {room.players.map((player) => (
                  <li
                    key={player.id}
                    className={player.id === selfId ? undefined : 'join-in'}
                  >
                    <Avatar
                      avatarId={player.avatarId}
                      animalId={player.animalId}
                      size="lobby"
                    />
                    <span className={styles.playerDetails}>
                      <span className={styles.playerName}>
                        {player.name}
                        {player.id === selfId && <Tag tone="accent">YOU</Tag>}
                        {player.isHost && <Tag tone="neutral">HOST</Tag>}
                      </span>
                      {!player.connected && (
                        <span className={styles.reconnecting}>Reconnecting…</span>
                      )}
                    </span>
                    <span className={styles.readyStatus} data-ready={player.ready}>
                      {player.ready ? '✓ Ready' : 'Waiting…'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {self && (
            <Button
              variant={self.ready ? 'ghost' : 'secondary'}
              aria-pressed={self.ready}
              onClick={() => setReady(!self.ready)}
            >
              {self.ready ? '✓ Ready' : 'I\'m Ready'}
            </Button>
          )}
          {self?.isHost && (
            <div className={styles.startGame}>
              <Button
                block
                disabled={!canStart}
                onClick={startMatch}
              >
                Start game
              </Button>
              <p>{startHint}</p>
            </div>
          )}
          {connectionError && (
            <div className={styles.error} role="alert">{connectionError.message}</div>
          )}
          {error && (
            <div className={styles.error} role="alert">{error.message}</div>
          )}
          {connectionStatus === 'terminal' && (
            <Button variant="secondary" onClick={() => navigate('/setup')}>
              Back to room setup
            </Button>
          )}
        </div>
      </div>
      <LobbyMusic />
      <Dialog
        open={matchStarting !== null}
        title="Match starting"
        onOpenChange={(open) => {
          if (!open) {
            dismissMatchStarting()
            navigate(`/room/${roomCode}/play`)
          }
        }}
        actions={(
          <Button
            onClick={() => {
              dismissMatchStarting()
              navigate(`/room/${roomCode}/play`)
            }}
          >
            Enter game
          </Button>
        )}
      >
        {matchStarting && (
          <>
            <p>
              {GAME_MODES[matchStarting.mode].label} · {matchStarting.tries} tries ·{' '}
              {matchStarting.playerCount} players
            </p>
            <p>Get ready. The game board is coming next.</p>
          </>
        )}
      </Dialog>
    </div>
  )
}
