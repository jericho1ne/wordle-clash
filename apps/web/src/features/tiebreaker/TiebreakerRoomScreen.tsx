import type {
  BeatmapEntry,
  Lane,
} from '@wordle-clash/shared'
import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import {
  useCallback,
  useEffect,
  useRef,
} from 'react'
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router'

import {
  DANCE_FLOOR_LOOKAHEAD_MS,
  FALLING_NOTE_COLOR,
  FRACTAL_SPIN_MULTIPLIER_PLAYING,
  HIT_FLASH_MS,
  KEYSTROKE_WINDOW,
  KEYSTROKE_WINDOW_OPACITY,
  KEYSTROKE_WINDOW_OUTLINE,
  NOTE_FADE_IN_OPACITY,
  NOTE_FADE_OUT_OPACITY,
  NOTE_FADE_OUT_ZONE,
  NOTE_HITLINE_OPACITY,
} from '../../constants'
import { useRoomStore } from '../../realtime'
import { Button } from '../../ui'
import { DanceOffResultDialog } from './DanceOffResultDialog'
import type { TiebreakerStageHandle } from './TiebreakerStage'
import { TiebreakerStage } from './TiebreakerStage'
import styles from './TiebreakerRoomScreen.module.scss'

const LANES: readonly Lane[] = ['left', 'down', 'right']
// The only place the A/S/D keys are set. Everything else on screen reads from here.
const KEY_TO_LANE: Record<string, Lane> = {
  a: 'left',
  s: 'down',
  d: 'right',
}
const LANE_KEY_LABEL = Object.fromEntries(
  Object.entries(KEY_TO_LANE).map(([key, lane]) => [lane, key.toUpperCase()]),
) as Record<Lane, string>
const KEY_LEGEND = Object.keys(KEY_TO_LANE).map((key) => key.toUpperCase()).join(' ')

/** A note fades in on the way down, peaks at the hit line, then quickly fades out right before it leaves the board. */
function noteOpacity(y: number, hitLineY: number, boardHeight: number): number {
  if (y <= hitLineY) {
    return NOTE_FADE_IN_OPACITY + (NOTE_HITLINE_OPACITY - NOTE_FADE_IN_OPACITY) * (y / hitLineY)
  }
  const fadeOutStart = boardHeight * (1 - NOTE_FADE_OUT_ZONE)
  if (y < fadeOutStart) return NOTE_HITLINE_OPACITY
  const t = (y - fadeOutStart) / (boardHeight - fadeOutStart)
  return NOTE_HITLINE_OPACITY + (NOTE_FADE_OUT_OPACITY - NOTE_HITLINE_OPACITY) * Math.min(1, t)
}

interface DanceFloorProps {
  name: string
  avatarId: number
  score: number
  entries: BeatmapEntry[]
  startsAt: number
  canPlay: boolean
  onHit: (lane: Lane, clientTimeMs: number) => void
}

function DanceFloor({ name, avatarId, score, entries, startsAt, canPlay, onHit }: DanceFloorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flashRefs = useRef<Record<Lane, number>>({ down: 0, left: 0, right: 0 })

  useEffect(() => {
    if (!canPlay) return

    function onKeyDown(event: KeyboardEvent) {
      const lane = KEY_TO_LANE[event.key.toLowerCase()]
      if (!lane) return
      // Sent for a future latency-compensation story; the Room DO judges
      // against its own receipt time today (see docs/stories/09-tiebreaker-battle).
      const clientTimeMs = Date.now() - startsAt
      flashRefs.current[lane] = clientTimeMs + HIT_FLASH_MS
      onHit(lane, clientTimeMs)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canPlay, startsAt, onHit])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const laneWidth = canvas.width / LANES.length
    // 30% up from the bottom edge, so the (taller) hit-line box stays fully on screen.
    const hitLineY = canvas.height * 0.7

    const draw = () => {
      const nowMs = Date.now() - startsAt
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      LANES.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth
        const flashing = nowMs < flashRefs.current[lane]
        ctx.fillStyle = flashing ? 'rgba(132, 220, 198, 0.35)' : 'rgba(255, 255, 255, 0.04)'
        ctx.fillRect(x, 0, laneWidth - 3, canvas.height)
        ctx.strokeStyle = flashing ? '#84DCC6' : `rgba(255, 255, 255, ${KEYSTROKE_WINDOW_OPACITY})`
        ctx.lineWidth = flashing ? 3 : KEYSTROKE_WINDOW_OUTLINE
        ctx.strokeRect(x + 1, hitLineY, laneWidth - 5, KEYSTROKE_WINDOW)

        for (const entry of entries) {
          if (entry.lane !== lane) continue
          const delta = entry.timeMs - nowMs
          if (delta > DANCE_FLOOR_LOOKAHEAD_MS) continue
          const progress = 1 - delta / DANCE_FLOOR_LOOKAHEAD_MS
          const y = progress * hitLineY
          if (y > canvas.height) continue
          const [noteR, noteG, noteB] = FALLING_NOTE_COLOR
          ctx.fillStyle = `rgba(${noteR}, ${noteG}, ${noteB}, ${noteOpacity(y, hitLineY, canvas.height)})`
          ctx.fillRect(x + laneWidth / 2 - 16, y - 7, 32, 14)
        }
      })

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [entries, startsAt])

  return (
    <div className={styles.danceFloor} data-avatar-id={avatarId}>
      <div className={styles.panel}>
        <div className={styles.dancerHeader}>
          <strong className={styles.textTilt}>{name}</strong>
          {canPlay && <span>{KEY_LEGEND}</span>}
        </div>
        <div className={`${styles.hud} ${styles.textTilt}`}>Score {score}</div>
        <div className={styles.laneLabels}>
          {LANES.map((lane) => <span key={lane}>{LANE_KEY_LABEL[lane]}</span>)}
        </div>
        <canvas ref={canvasRef} width={260} height={380} className={styles.canvas} />
      </div>
    </div>
  )
}

/** The real dance-off (`/room/:code/tiebreaker`). Tied players play with A/S/D; everyone else just watches. */
export function TiebreakerRoomScreen() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const roomCode = normalizeRoomCode(code)
  const stageRef = useRef<TiebreakerStageHandle | null>(null)

  const connect = useRoomStore(({ connect }) => connect)
  const disconnect = useRoomStore(({ disconnect }) => disconnect)
  const room = useRoomStore(({ room }) => room)
  const selfId = useRoomStore(({ selfId }) => selfId)
  const match = useRoomStore(({ match }) => match)
  const danceOff = useRoomStore(({ danceOff }) => danceOff)
  const danceOffHit = useRoomStore(({ danceOffHit }) => danceOffHit)
  const submitDanceHit = useRoomStore(({ submitDanceHit }) => submitDanceHit)
  const returnToLobby = useRoomStore(({ returnToLobby }) => returnToLobby)

  useEffect(() => {
    connect(roomCode)
    return disconnect
  }, [connect, disconnect, roomCode])

  useEffect(() => {
    if (!match) return
    // A tiebreak-finished match keeps its origin in tiebreakPlayerIds, so the
    // winner banner stays visible here instead of bouncing back to /play.
    const cameFromTiebreak = match.phase === 'tiebreak' || match.tiebreakPlayerIds.length > 0
    if (!cameFromTiebreak) navigate(`/room/${roomCode}/play`, { replace: true })
  }, [match, navigate, roomCode])

  // The server is the only judge of a hit — this flashes the shared
  // fractal once it says so, for whichever player it was about.
  useEffect(() => {
    if (!danceOffHit) return
    stageRef.current?.flash(danceOffHit.judgment === 'miss' ? 'miss' : 'correct')
  }, [danceOffHit])

  // Spin faster while the music/dance-off is actually playing.
  useEffect(() => {
    stageRef.current?.setSpinSpeed(danceOff && match?.phase !== 'finished' ? FRACTAL_SPIN_MULTIPLIER_PLAYING : 1)
  }, [danceOff, match?.phase])

  const handleHit = useCallback((lane: Lane, clientTimeMs: number) => {
    submitDanceHit(lane, clientTimeMs)
  }, [submitDanceHit])

  if (!isValidRoomCode(roomCode)) return <Navigate to="/setup" replace />

  const dancerIds = danceOff?.playerIds ?? match?.tiebreakPlayerIds ?? []
  const isDancer = !!selfId && dancerIds.includes(selfId)
  const battleOver = match?.phase === 'finished'
  const [leftId, rightId] = dancerIds
  const leftPlayer = room?.players.find(({ id }) => id === leftId)
  const rightPlayer = room?.players.find(({ id }) => id === rightId)
  const winnerSide = match?.winnerId === leftId ? 'left' : match?.winnerId === rightId ? 'right' : null

  return (
    <TiebreakerStage ref={stageRef} roomLabel={`Room ${roomCode}`} word={match?.answer ?? null}>
      {!danceOff && <div className="card">Waiting for the dance-off to start…</div>}

      {danceOff && (
        <>
          {!isDancer && !battleOver && (
            <p className={styles.spectatorNote}>You&apos;re spectating — {dancerIds.length} players are battling it out.</p>
          )}

          <div className={styles.floors}>
            {dancerIds.map((playerId) => {
              const player = room?.players.find(({ id }) => id === playerId)
              return (
                <DanceFloor
                  key={playerId}
                  name={player?.name ?? 'Dancer'}
                  avatarId={player?.avatarId ?? 0}
                  score={danceOff.scores[playerId] ?? 0}
                  entries={danceOff.beatmap.entries}
                  startsAt={danceOff.startsAt}
                  canPlay={!battleOver && playerId === selfId}
                  onHit={handleHit}
                />
              )
            })}
          </div>

          {battleOver && (
            <DanceOffResultDialog
              open
              onOpenChange={() => {}}
              left={{ name: leftPlayer?.name ?? 'Dancer', score: leftId ? danceOff.scores[leftId] ?? 0 : 0 }}
              right={{ name: rightPlayer?.name ?? 'Dancer', score: rightId ? danceOff.scores[rightId] ?? 0 : 0 }}
              winnerSide={winnerSide}
              actions={(
                <Button
                  appearance="secondary"
                  disabled={!room?.players.find(({ id }) => id === selfId)?.isHost}
                  onClick={returnToLobby}
                >
                  Return to lobby
                </Button>
              )}
            />
          )}
        </>
      )}
    </TiebreakerStage>
  )
}
