import type {
  BeatmapEntry,
  Lane,
} from '@wordle-clash/shared'
import { LANES } from '@wordle-clash/shared'
import {
  useCallback,
  useEffect,
  useRef,
} from 'react'
import {
  DANCE_FLOOR_LOOKAHEAD_MS,
  HIT_FLASH_MS,
  KEYSTROKE_WINDOW,
  KEYSTROKE_WINDOW_OPACITY,
  KEYSTROKE_WINDOW_OUTLINE,
  NOTE_FADE_IN_OPACITY,
  NOTE_FADE_OUT_OPACITY,
  NOTE_FADE_OUT_ZONE,
  NOTE_HITLINE_OPACITY,
} from '@/constants'

import { PlayerBoardFrame } from './PlayerBoardFrame'
import { useDanceInput } from './useDanceInput'
import styles from './DanceBoard.module.scss'

const ARROW_GLYPH: Record<string, string> = { ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }

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

interface DanceBoardProps {
  name: string
  playerColorId: number
  score: number
  entries: BeatmapEntry[]
  clockMs: () => number
  keyToLane: Record<string, Lane>
  combo?: number
  variant?: 'room' | 'playground'
  isConsumed?: (entry: BeatmapEntry) => boolean
  highestScore: number
  isLeader: boolean
  canPlay: boolean
  onHit: (lane: Lane, clientTimeMs: number) => void
}

export function DanceBoard({ name, playerColorId, score, entries, clockMs, keyToLane, combo, variant = 'room', isConsumed, highestScore, isLeader, canPlay, onHit }: DanceBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flashRefs = useRef<Record<Lane, number>>({ down: 0, left: 0, right: 0 })

  const handleHit = useCallback((lane: Lane, timeMs: number) => {
    flashRefs.current[lane] = timeMs + HIT_FLASH_MS
    onHit(lane, timeMs)
  }, [onHit])

  useDanceInput(keyToLane, canPlay, clockMs, handleHit)
  const keys = Object.keys(keyToLane)
  const legend = keys.every((key) => key.length === 1) ? keys.join(' ').toUpperCase() : 'Arrow keys'
  const labels = Object.fromEntries(Object.entries(keyToLane).map(([key, lane]) => [
    lane,
    ARROW_GLYPH[key] ?? key.toUpperCase(),
  ]))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const laneWidth = canvas.width / LANES.length
    const noteColor = getComputedStyle(canvas).color
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

        for (const entry of entries) {
          if (entry.lane !== lane || isConsumed?.(entry)) continue
          const delta = entry.timeMs - nowMs
          if (delta > DANCE_FLOOR_LOOKAHEAD_MS) continue
          const progress = 1 - delta / DANCE_FLOOR_LOOKAHEAD_MS
          const y = progress * hitLineY
          if (y > canvas.height) continue
          const noteWidth = laneWidth * 0.9
          const noteX = x + (laneWidth - noteWidth) / 2
          ctx.save()
          ctx.globalAlpha = noteOpacity(y, hitLineY, canvas.height)
          ctx.fillStyle = noteColor
          ctx.shadowColor = noteColor
          ctx.shadowBlur = 18
          ctx.fillRect(noteX, y - 7, noteWidth, 14)
          ctx.restore()
        }
      })

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [entries, clockMs, isConsumed, playerColorId])

  return (
    <div className={styles.danceBoard} data-variant={variant}>
      <PlayerBoardFrame
        name={name}
        score={score}
        highest={highestScore}
        isLeader={isLeader}
        playerColorId={playerColorId}
      >
        <div className={styles.danceFloor}>
          <div className={styles.playerBoard} data-player-color-id={playerColorId}>
            <div className={styles.dancerHeader}>
              <strong className={styles.textTilt}>{name}</strong>
              {canPlay && <span>{legend}</span>}
            </div>
            <div className={`${styles.hud} ${styles.textTilt}`}>
              <span>Score {score}</span>
              {combo !== undefined && <span>Combo {combo}</span>}
            </div>
            <div className={styles.laneLabels}>
              {LANES.map((lane) => <span key={lane}>{labels[lane]}</span>)}
            </div>
            <canvas ref={canvasRef} width={variant === 'room' ? 260 : 280} height={variant === 'room' ? 380 : 420} className={styles.canvas} />
          </div>
        </div>
      </PlayerBoardFrame>
    </div>
  )
}
