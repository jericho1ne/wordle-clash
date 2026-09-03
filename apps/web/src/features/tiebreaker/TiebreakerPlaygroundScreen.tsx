import type {
  Beatmap,
  BeatmapEntry,
  Lane,
} from '@wordle-clash/shared'
import {
  DANCE_OFF_CLIP_MS,
  DANCE_OFF_GOOD_WINDOW_MS,
  DANCE_OFF_POINTS,
  judgeDanceHit,
  sliceBeatmapClip,
} from '@wordle-clash/shared'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { DEFAULT_PLAYBACK_RATE } from '../../constants'
import {
  Button,
  PlaybackSpeedSlider,
} from '../../ui'
import type { BeatFractalHandle } from './BeatFractalBackground'
import { BeatFractalBackground } from './BeatFractalBackground'
import type { ThemeName } from './beatFractalEngine'
import styles from './TiebreakerPlaygroundScreen.module.scss'

const TRACK_SRC = '/audio/canto-de-ossanha.mp3'
const BEATMAP_SRC = '/audio/canto-de-ossanha.beatmap.json'
const LANES: readonly Lane[] = ['left', 'up', 'down', 'right']
const LANE_LABEL: Record<Lane, string> = { up: '↑', down: '↓', left: '←', right: '→' }
const LOOKAHEAD_MS = 1800

interface DancerConfig {
  id: 'p1' | 'p2'
  name: string
  theme: ThemeName
  keyToLane: Record<string, Lane>
  keyLegend: string
}

const DANCERS: DancerConfig[] = [
  {
    id: 'p1',
    name: 'Player 1',
    theme: 'neonArcade',
    keyToLane: { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' },
    keyLegend: 'Arrow keys',
  },
  {
    id: 'p2',
    name: 'Player 2',
    theme: 'synthwaveSunset',
    keyToLane: { w: 'up', s: 'down', a: 'left', d: 'right' },
    keyLegend: 'W A S D',
  },
]

interface LiveEntry extends BeatmapEntry {
  consumed: boolean
}

type BattlePhase = 'idle' | 'running' | 'ended'

function useDancerScore() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const addJudgment = useCallback((judgment: 'perfect' | 'good' | 'miss') => {
    setScore((s) => s + DANCE_OFF_POINTS[judgment])
    setCombo((c) => (judgment === 'miss' ? 0 : c + 1))
  }, [])
  const reset = useCallback(() => {
    setScore(0)
    setCombo(0)
  }, [])
  return { score, combo, addJudgment, reset }
}

interface DanceFloorProps {
  dancer: DancerConfig
  clipEntries: BeatmapEntry[]
  phase: BattlePhase
  clockMs: () => number
  onScoreChange: (dancerId: string, score: number) => void
}

function DanceFloor({ dancer, clipEntries, phase, clockMs, onScoreChange }: DanceFloorProps) {
  const bgRef = useRef<BeatFractalHandle | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flashRefs = useRef<Record<Lane, number>>({ up: 0, down: 0, left: 0, right: 0 })
  const liveEntriesRef = useRef<LiveEntry[]>([])
  const { score, combo, addJudgment, reset } = useDancerScore()

  useEffect(() => {
    // Re-arm on every battle start (idle/ended -> running), not just when the
    // clip itself changes, so "Dance again" resets consumed notes and score.
    if (phase !== 'running') return
    liveEntriesRef.current = clipEntries.map((entry) => ({ ...entry, consumed: false }))
    reset()
  }, [phase, clipEntries, reset])

  useEffect(() => { onScoreChange(dancer.id, score) }, [dancer.id, score, onScoreChange])

  useEffect(() => {
    if (phase !== 'running') return

    function onKeyDown(event: KeyboardEvent) {
      const lane = dancer.keyToLane[event.key]
      if (!lane) return
      const nowMs = clockMs()

      let best: LiveEntry | null = null
      let bestDelta = Infinity
      for (const entry of liveEntriesRef.current) {
        if (entry.consumed || entry.lane !== lane) continue
        const delta = entry.timeMs - nowMs
        if (Math.abs(delta) < Math.abs(bestDelta)) {
          best = entry
          bestDelta = delta
        }
      }

      const judgment = best && Math.abs(bestDelta) <= DANCE_OFF_GOOD_WINDOW_MS
        ? judgeDanceHit(bestDelta)
        : 'miss'
      if (best && judgment !== 'miss') best.consumed = true

      addJudgment(judgment)
      flashRefs.current[lane] = nowMs + 120
      bgRef.current?.pulse(judgment === 'perfect' ? 1.4 : judgment === 'good' ? 0.9 : 0.3)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, dancer.keyToLane, clockMs, addJudgment])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const laneWidth = canvas.width / LANES.length
    const hitLineY = canvas.height - 32

    const draw = () => {
      const nowMs = clockMs()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      LANES.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth
        const flashing = nowMs < flashRefs.current[lane]
        ctx.fillStyle = flashing ? 'rgba(132, 220, 198, 0.35)' : 'rgba(255, 255, 255, 0.04)'
        ctx.fillRect(x, 0, laneWidth - 3, canvas.height)
        ctx.strokeStyle = flashing ? '#84DCC6' : 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = flashing ? 3 : 2
        ctx.strokeRect(x + 1, hitLineY, laneWidth - 5, 5)

        for (const entry of liveEntriesRef.current) {
          if (entry.lane !== lane || entry.consumed) continue
          const delta = entry.timeMs - nowMs
          if (delta < -DANCE_OFF_GOOD_WINDOW_MS) { entry.consumed = true; continue }
          if (delta > LOOKAHEAD_MS) continue
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
  }, [clockMs])

  return (
    <div className={styles.danceFloor}>
      <BeatFractalBackground
        ref={bgRef}
        theme={dancer.theme}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, borderRadius: 'var(--radius-lg)' }}
      />
      <div className={styles.panel}>
        <div className={styles.header}>
          <strong>{dancer.name}</strong>
          <span>{dancer.keyLegend}</span>
        </div>
        <div className={styles.hud}>
          <span>Score {score}</span>
          <span>Combo {combo}</span>
        </div>
        <div className={styles.laneLabels}>
          {LANES.map((lane) => <span key={lane}>{LANE_LABEL[lane]}</span>)}
        </div>
        <canvas ref={canvasRef} width={280} height={420} className={styles.canvas} />
      </div>
    </div>
  )
}

/**
 * Story 09-01 — DEV-only playground (route `/tiebreaker`) for the DDR
 * dance-off: two local dancers (arrow keys vs WASD) battle against the same
 * 20s clip of the real beatmap, no server involved. Validates the mechanic,
 * scoring, and fractal integration before Epic 09 wires it into the real
 * tiebreak flow at `/room/:code/tiebreaker`.
 */
export function TiebreakerPlaygroundScreen() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startedAtRef = useRef(0)
  // Snapshot of playbackRate at battle start — the slider locks once
  // `phase !== 'idle'`, but a ref (rather than reading state mid-battle)
  // keeps the running battle's timing math decoupled from the control.
  const battleRateRef = useRef(DEFAULT_PLAYBACK_RATE)
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<BattlePhase>('idle')
  const [scores, setScores] = useState<Record<string, number>>({ p1: 0, p2: 0 })
  const [playbackRate, setPlaybackRate] = useState(DEFAULT_PLAYBACK_RATE)

  useEffect(() => {
    fetch(BEATMAP_SRC)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json()
      })
      .then((data: Beatmap) => setBeatmap(data))
      .catch((err: Error) => setError(err.message))
  }, [])

  const clipEntries = useMemo(
    () => (beatmap ? sliceBeatmapClip(beatmap, 0, DANCE_OFF_CLIP_MS) : []),
    [beatmap],
  )

  // Track-time (beatmap ms), not wall-clock ms: scaling elapsed real time by
  // the chosen rate is what makes a slower speed actually slow the game
  // down, the same way HTMLMediaElement.currentTime tracks content position
  // regardless of playbackRate. Kept independent of the <audio> element's
  // own clock so the battle still runs correctly if autoplay is blocked.
  const clockMs = useCallback(() => {
    if (phase !== 'running') return 0
    return (performance.now() - startedAtRef.current) * battleRateRef.current
  }, [phase])

  const handleScoreChange = useCallback((dancerId: string, score: number) => {
    setScores((prev) => (prev[dancerId] === score ? prev : { ...prev, [dancerId]: score }))
  }, [])

  function startBattle() {
    battleRateRef.current = playbackRate
    startedAtRef.current = performance.now()
    setScores({ p1: 0, p2: 0 })
    setPhase('running')
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
    audioRef.current?.play().catch(() => {})
    // Real time to cover the full clip at this rate: at 60% speed, 20s of
    // track content takes 20s / 0.6 ≈ 33.3s of wall-clock time to play through.
    window.setTimeout(() => {
      setPhase('ended')
      audioRef.current?.pause()
    }, DANCE_OFF_CLIP_MS / playbackRate)
  }

  const winnerText = phase === 'ended'
    ? scores.p1 === scores.p2
      ? 'It\'s a tie — run it again!'
      : `${scores.p1 > scores.p2 ? DANCERS[0]?.name : DANCERS[1]?.name} wins!`
    : null

  return (
    <div className="app-stage">
      <main className={`app-stage__inner ${styles.tiebreakerPlayground}`}>
        <h1>Tiebreaker Battle</h1>
        {error && <p className={styles.error}>Failed to load beatmap: {error}</p>}
        <audio ref={audioRef} src={TRACK_SRC} className={styles.audio} />

        <div className={styles.controls}>
          <PlaybackSpeedSlider value={playbackRate} onChange={setPlaybackRate} disabled={phase === 'running'} />
          <Button appearance="primary" onClick={startBattle} disabled={!beatmap || phase === 'running'}>
            {phase === 'idle' ? 'Start battle' : phase === 'running' ? 'Dancing…' : 'Dance again'}
          </Button>
          {winnerText && <p className={styles.winner}>{winnerText}</p>}
        </div>

        <div className={styles.floors}>
          {DANCERS.map((dancer) => (
            <DanceFloor
              key={dancer.id}
              dancer={dancer}
              clipEntries={clipEntries}
              phase={phase}
              clockMs={clockMs}
              onScoreChange={handleScoreChange}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
