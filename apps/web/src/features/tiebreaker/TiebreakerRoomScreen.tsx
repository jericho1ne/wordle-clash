import type { BeatmapEntry, Lane } from '@wordle-clash/shared'
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

import { useRoomStore } from '../../realtime'
import { Button } from '../../ui'
import type { BeatFractalHandle } from './BeatFractalBackground'
import { BeatFractalBackground } from './BeatFractalBackground'
import type { ThemeName } from './beatFractalEngine'
import styles from './TiebreakerRoomScreen.module.scss'

const LANES: readonly Lane[] = ['left', 'up', 'down', 'right']
const LANE_LABEL: Record<Lane, string> = { up: '↑', down: '↓', left: '←', right: '→' }
const KEY_TO_LANE: Record<string, Lane> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}
const DANCER_THEMES: ThemeName[] = ['neonArcade', 'synthwaveSunset', 'cyberIce', 'inferno']
const LOOKAHEAD_MS = 1800

interface DanceFloorProps {
  name: string
  theme: ThemeName
  score: number
  entries: BeatmapEntry[]
  startsAt: number
  canPlay: boolean
  onHit: (lane: Lane, clientTimeMs: number) => void
}

function DanceFloor({ name, theme, score, entries, startsAt, canPlay, onHit }: DanceFloorProps) {
  const bgRef = useRef<BeatFractalHandle | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flashRefs = useRef<Record<Lane, number>>({ up: 0, down: 0, left: 0, right: 0 })

  useEffect(() => {
    if (!canPlay) return

    function onKeyDown(event: KeyboardEvent) {
      const lane = KEY_TO_LANE[event.key]
      if (!lane) return
      // Sent for a future latency-compensation story; the Room DO judges
      // against its own receipt time today (see docs/stories/09-tiebreaker-battle).
      const clientTimeMs = Date.now() - startsAt
      flashRefs.current[lane] = clientTimeMs + 120
      bgRef.current?.pulse(1.0)
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
    const hitLineY = canvas.height - 32

    const draw = () => {
      const nowMs = Date.now() - startsAt
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      LANES.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth
        const flashing = nowMs < flashRefs.current[lane]
        ctx.fillStyle = flashing ? 'rgba(132, 220, 198, 0.35)' : 'rgba(255, 255, 255, 0.04)'
        ctx.fillRect(x, 0, laneWidth - 3, canvas.height)
        ctx.strokeStyle = flashing ? '#84DCC6' : 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = flashing ? 3 : 2
        ctx.strokeRect(x + 1, hitLineY, laneWidth - 5, 5)

        for (const entry of entries) {
          if (entry.lane !== lane) continue
          const delta = entry.timeMs - nowMs
          if (delta < -160 || delta > LOOKAHEAD_MS) continue
          const progress = 1 - delta / LOOKAHEAD_MS
          const y = progress * hitLineY
          ctx.fillStyle = '#F0803C'
          ctx.fillRect(x + laneWidth / 2 - 16, y - 7, 32, 14)
        }
      })

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [entries, startsAt])

  return (
    <div className={styles.danceFloor}>
      <BeatFractalBackground
        ref={bgRef}
        theme={theme}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, borderRadius: 'var(--radius-lg)' }}
      />
      <div className={styles.panel}>
        <div className={styles.dancerHeader}>
          <strong>{name}</strong>
          {canPlay && <span>Arrow keys</span>}
        </div>
        <div className={styles.hud}>Score {score}</div>
        <div className={styles.laneLabels}>
          {LANES.map((lane) => <span key={lane}>{LANE_LABEL[lane]}</span>)}
        </div>
        <canvas ref={canvasRef} width={260} height={380} className={styles.canvas} />
      </div>
    </div>
  )
}

/**
 * Story 09-04 — the real, guarded Tiebreaker Battle (route
 * `/room/:code/tiebreaker`). Tied players (room.match.tiebreakPlayerIds)
 * get interactive arrow-key input; every other connected player lands here
 * too, in read-only spectator mode. All scoring comes from the Room DO's
 * broadcast danceOffScore/danceOffEnded messages — this screen never
 * judges a hit locally.
 */
export function TiebreakerRoomScreen() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const roomCode = normalizeRoomCode(code)

  const connect = useRoomStore(({ connect }) => connect)
  const disconnect = useRoomStore(({ disconnect }) => disconnect)
  const room = useRoomStore(({ room }) => room)
  const selfId = useRoomStore(({ selfId }) => selfId)
  const match = useRoomStore(({ match }) => match)
  const danceOff = useRoomStore(({ danceOff }) => danceOff)
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

  const handleHit = useCallback((lane: Lane, clientTimeMs: number) => {
    submitDanceHit(lane, clientTimeMs)
  }, [submitDanceHit])

  if (!isValidRoomCode(roomCode)) return <Navigate to="/setup" replace />

  const dancerIds = danceOff?.playerIds ?? match?.tiebreakPlayerIds ?? []
  const isDancer = !!selfId && dancerIds.includes(selfId)
  const winner = room?.players.find(({ id }) => id === match?.winnerId)
  const battleOver = match?.phase === 'finished'

  return (
    <div className="app-stage">
      <main className={`app-stage__inner ${styles.tiebreakerRoom}`}>
        <header className={styles.header}>
          <div className="card-kicker">Room {roomCode}</div>
          <h1>Tiebreaker Battle</h1>
        </header>

        {!danceOff && <div className="card">Waiting for the dance-off to start…</div>}

        {danceOff && (
          <>
            {battleOver && winner && <p className={styles.winner}>{winner.name} wins the dance-off!</p>}
            {!isDancer && !battleOver && (
              <p className={styles.spectatorNote}>You&apos;re spectating — {dancerIds.length} players are battling it out.</p>
            )}

            <div className={styles.floors}>
              {dancerIds.map((playerId, index) => (
                <DanceFloor
                  key={playerId}
                  name={room?.players.find(({ id }) => id === playerId)?.name ?? 'Dancer'}
                  theme={DANCER_THEMES[index % DANCER_THEMES.length] ?? 'neonArcade'}
                  score={danceOff.scores[playerId] ?? 0}
                  entries={danceOff.beatmap.entries}
                  startsAt={danceOff.startsAt}
                  canPlay={!battleOver && playerId === selfId}
                  onHit={handleHit}
                />
              ))}
            </div>
          </>
        )}

        {battleOver && (
          <Button
            appearance="secondary"
            disabled={!room?.players.find(({ id }) => id === selfId)?.isHost}
            onClick={returnToLobby}
          >
            Return to lobby
          </Button>
        )}
      </main>
    </div>
  )
}
