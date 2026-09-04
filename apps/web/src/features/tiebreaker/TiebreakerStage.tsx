import type { ReactNode } from 'react'
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {
  FRACTAL_BASE_BRIGHTNESS,
  FRACTAL_BASE_SATURATION,
  FRACTAL_FLASH_BRIGHTNESS,
  FRACTAL_FLASH_COLOR_CORRECT,
  FRACTAL_FLASH_COLOR_MISS,
} from '../../constants'
import type { BeatFractalHandle } from './BeatFractalBackground'
import { BeatFractalBackground } from './BeatFractalBackground'
import {
  THEMES,
  type ThemeName,
} from './beatFractalEngine'
import styles from './TiebreakerStage.module.scss'

export interface TiebreakerStageHandle {
  /** Pulses the single shared page background — call on either dancer's hit. */
  pulse: (strength?: number) => void
  /** Flashes the shared background green ("correct") or red ("miss"). */
  flash: (kind: 'correct' | 'miss', strength?: number) => void
}

export interface TiebreakerStageProps {
  roomLabel?: ReactNode
  /** The word that produced the tie, once revealed. Null while not yet available. */
  word: string | null
  children: ReactNode
}

function randomTheme(): ThemeName {
  const names = Object.keys(THEMES) as ThemeName[]
  return names[Math.floor(Math.random() * names.length)] ?? 'neonArcade'
}

/** The shared look for both Tiebreaker screens: one big randomized fractal background, the heading, and the tied word. */
export const TiebreakerStage = forwardRef<TiebreakerStageHandle, TiebreakerStageProps>(
  ({ roomLabel, word, children }, ref) => {
    const bgRef = useRef<BeatFractalHandle | null>(null)
    const [theme] = useState(randomTheme)

    useImperativeHandle(ref, () => ({
      pulse: (strength = 1.0) => bgRef.current?.pulse(strength),
      flash: (kind, strength = 1.0) => {
        const [r, g, b] = kind === 'correct' ? FRACTAL_FLASH_COLOR_CORRECT : FRACTAL_FLASH_COLOR_MISS
        const color: [number, number, number] = [
          r * FRACTAL_FLASH_BRIGHTNESS,
          g * FRACTAL_FLASH_BRIGHTNESS,
          b * FRACTAL_FLASH_BRIGHTNESS,
        ]
        bgRef.current?.flash(color, strength)
      },
    }), [])

    return (
      <div className={styles.stageRoot}>
        <BeatFractalBackground
          ref={bgRef}
          theme={theme}
          baseBrightness={FRACTAL_BASE_BRIGHTNESS}
          baseSaturation={FRACTAL_BASE_SATURATION}
        />
        <main className={styles.tiebreakerStage}>
          {roomLabel && <div className={`card-kicker ${styles.kicker}`}>{roomLabel}</div>}
          <h1 className={styles.textTilt}>Tiebreaker!</h1>
          {word && (
            <p className={styles.word}>
              Tied on <strong className={styles.textTilt}>{word}</strong>
            </p>
          )}
          {children}
        </main>
      </div>
    )
  },
)

TiebreakerStage.displayName = 'TiebreakerStage'
