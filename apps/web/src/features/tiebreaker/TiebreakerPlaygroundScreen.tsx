import type {
  Beatmap,
  BeatmapEntry,
  DanceHitJudgment,
  Lane,
} from '@wordle-clash/shared'
import {
  DANCE_OFF_CLIP_MS,
  DANCE_OFF_MAX_WINDOW_MS,
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
import { useSearchParams } from 'react-router'

import {
  DANCE_FLOOR_LOOKAHEAD_MS,
  DEFAULT_MOCK_WORD,
  DEFAULT_PLAYBACK_RATE,
  HIT_FLASH_MS,
  KEYSTROKE_WINDOW,
  KEYSTROKE_WINDOW_OPACITY,
  KEYSTROKE_WINDOW_OUTLINE,
} from '../../constants'
import {
  Button,
  PlaybackSpeedSlider,
} from '../../ui'
import type { TiebreakerStageHandle } from './TiebreakerStage'
import { TiebreakerStage } from './TiebreakerStage'
import styles from './TiebreakerPlaygroundScreen.module.scss'

const TRACK_SRC = '/audio/canto-de-ossanha.mp3'
const BEATMAP_SRC = '/audio/canto-de-ossanha.beatmap.json'
const LANES: readonly Lane[] = ['left', 'down', 'right']

interface DancerConfig {
  id: 'p1' | 'p2'
  name: string
  avatarId: number
  keyToLane: Record<string, Lane>
}

const DANCERS: DancerConfig[] = [
  {
    id: 'p1',
    name: 'Player 1',
    avatarId: 0,
    // Player 1's keys: A, S, D. Everything else on screen for Player 1
    // (the labels above each lane, the "A S D" text) reads this same map,
    // so it always matches what the keys actually do.
    keyToLane: { a: 'left', s: 'down', d: 'right' },
  },
  {
    id: 'p2',
    name: 'Player 2',
    avatarId: 1,
    // Player 2's keys: the Left, Down, Right arrows.
    keyToLane: { ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right' },
  },
]

/** e.g. { a: 'left', s: 'down' } -> "A S", or { ArrowLeft: 'left' } -> "Arrow keys" for the non-letter scheme. */
function describeKeys(keyToLane: Record<string, Lane>): string {
  const keys = Object.keys(keyToLane)
  return keys.every((key) => key.length === 1)
    ? keys.map((key) => key.toUpperCase()).join(' ')
    : 'Arrow keys'
}

const ARROW_GLYPH: Record<string, string> = { ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }

/** Column header label for each lane, read from the same keyToLane map that drives input. */
function laneKeyLabels(keyToLane: Record<string, Lane>): Record<Lane, string> {
  return Object.fromEntries(
    Object.entries(keyToLane).map(([key, lane]) => [
      lane,
      key.length === 1 ? key.toUpperCase() : (ARROW_GLYPH[key] ?? key),
    ]),
  ) as Record<Lane, string>
}

interface LiveEntry extends BeatmapEntry {
  consumed: boolean
}

type BattlePhase = 'idle' | 'running' | 'ended'

function useDancerScore() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const addJudgment = useCallback((judgment: DanceHitJudgment) => {
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
  flash: (kind: 'correct' | 'miss', strength?: number) => void
}

function DanceFloor({ dancer, clipEntries, phase, clockMs, onScoreChange, flash }: DanceFloorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flashRefs = useRef<Record<Lane, number>>({ down: 0, left: 0, right: 0 })
  const liveEntriesRef = useRef<LiveEntry[]>([])
  const { score, combo, addJudgment, reset } = useDancerScore()
  const laneLabels = useMemo(() => laneKeyLabels(dancer.keyToLane), [dancer.keyToLane])

  useEffect(() => {
    // Runs every time a new battle starts, so "Dance again" starts clean.
    if (phase !== 'running') return
    liveEntriesRef.current = clipEntries.map((entry) => ({ ...entry, consumed: false }))
    reset()
  }, [phase, clipEntries, reset])

  useEffect(() => {
    onScoreChange(dancer.id, score)
  }, [dancer.id, score, onScoreChange])

  useEffect(() => {
    if (phase !== 'running') return

    function onKeyDown(event: KeyboardEvent) {
      // Try the key as typed first (for "ArrowLeft"), then lowercase (for letters).
      const lane = dancer.keyToLane[event.key] ?? dancer.keyToLane[event.key.toLowerCase()]
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

      const judgment = best && Math.abs(bestDelta) <= DANCE_OFF_MAX_WINDOW_MS
        ? judgeDanceHit(bestDelta)
        : 'miss'
      if (best && judgment !== 'miss') best.consumed = true

      addJudgment(judgment)
      flashRefs.current[lane] = nowMs + HIT_FLASH_MS
      const strength = judgment === 'miss' ? 1.0 : 0.6 + (DANCE_OFF_POINTS[judgment] / 5) * 0.8
      flash(judgment === 'miss' ? 'miss' : 'correct', strength)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, dancer.keyToLane, clockMs, addJudgment, flash])

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
      const nowMs = clockMs()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      LANES.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth
        const flashing = nowMs < flashRefs.current[lane]
        ctx.fillStyle = flashing ? 'rgba(132, 220, 198, 0.35)' : 'rgba(255, 255, 255, 0.04)'
        ctx.fillRect(x, 0, laneWidth - 3, canvas.height)
        ctx.strokeStyle = flashing ? '#84DCC6' : `rgba(255, 255, 255, ${KEYSTROKE_WINDOW_OPACITY})`
        ctx.lineWidth = flashing ? 3 : KEYSTROKE_WINDOW_OUTLINE
        ctx.strokeRect(x + 1, hitLineY, laneWidth - 5, KEYSTROKE_WINDOW)

        for (const entry of liveEntriesRef.current) {
          if (entry.lane !== lane || entry.consumed) continue
          const delta = entry.timeMs - nowMs
          if (delta < -DANCE_OFF_MAX_WINDOW_MS) {
            entry.consumed = true
            continue
          }
          if (delta > DANCE_FLOOR_LOOKAHEAD_MS) continue
          const progress = 1 - delta / DANCE_FLOOR_LOOKAHEAD_MS
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
    <div className={styles.danceFloor} data-avatar-id={dancer.avatarId}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <strong className={styles.textTilt}>{dancer.name}</strong>
          <span>{describeKeys(dancer.keyToLane)}</span>
        </div>
        <div className={`${styles.hud} ${styles.textTilt}`}>
          <span>Score {score}</span>
          <span>Combo {combo}</span>
        </div>
        <div className={styles.laneLabels}>
          {LANES.map((lane) => <span key={lane}>{laneLabels[lane]}</span>)}
        </div>
        <canvas ref={canvasRef} width={280} height={420} className={styles.canvas} />
      </div>
    </div>
  )
}

/**
 * Story 09-01 — DEV playground (route `/tiebreaker`) for the DDR dance-off.
 * Two local dancers battle the same 20s clip, no server involved. Good for
 * trying out the look and feel before touching the real game.
 */
export function TiebreakerPlaygroundScreen() {
  const [searchParams] = useSearchParams()
  const word = searchParams.get('word') ?? DEFAULT_MOCK_WORD
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stageRef = useRef<TiebreakerStageHandle | null>(null)
  const startedAtRef = useRef(0)
  // The speed picked before the battle starts, locked in for that whole battle.
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

  // Time is scaled by speed, so slower playback also slows the notes down.
  const clockMs = useCallback(() => {
    if (phase !== 'running') return 0
    return (performance.now() - startedAtRef.current) * battleRateRef.current
  }, [phase])

  const handleScoreChange = useCallback((dancerId: string, score: number) => {
    setScores((prev) => (prev[dancerId] === score ? prev : { ...prev, [dancerId]: score }))
  }, [])

  const flash = useCallback((kind: 'correct' | 'miss', strength?: number) => {
    stageRef.current?.flash(kind, strength)
  }, [])

  function startBattle() {
    battleRateRef.current = playbackRate
    startedAtRef.current = performance.now()
    setScores({ p1: 0, p2: 0 })
    setPhase('running')
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
    audioRef.current?.play().catch(() => {})
    window.setTimeout(() => {
      setPhase('ended')
      audioRef.current?.pause()
    }, DANCE_OFF_CLIP_MS / playbackRate)
  }

  const scoreP1 = scores.p1 ?? 0
  const scoreP2 = scores.p2 ?? 0
  const winnerText = phase === 'ended'
    ? scoreP1 === scoreP2
      ? 'It\'s a tie — run it again!'
      : `${scoreP1 > scoreP2 ? DANCERS[0]?.name : DANCERS[1]?.name} wins!`
    : null

  return (
    <TiebreakerStage ref={stageRef} word={word}>
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
            flash={flash}
          />
        ))}
      </div>
    </TiebreakerStage>
  )
}
