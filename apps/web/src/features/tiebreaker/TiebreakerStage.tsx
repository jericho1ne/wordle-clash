import type { ReactNode } from 'react'
import {
  forwardRef,
  useCallback,
  useEffect,
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
  FRACTAL_SIZE_INCREASE,
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
  /** Scales how fast the background spins — call with a higher number while music is playing. */
  setSpinSpeed: (multiplier: number) => void
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

/** The shared look for both Tiebreaker screens: one randomized fractal background, 3D plane, and drifting tied word. */
export const TiebreakerStage = forwardRef<TiebreakerStageHandle, TiebreakerStageProps>(
  ({ roomLabel, word, children }, ref) => {
    const bgRef = useRef<BeatFractalHandle | null>(null)
    const lightRef = useRef<HTMLDivElement | null>(null)
    const lightAnimationRef = useRef<Animation | null>(null)
    const [theme] = useState(randomTheme)
    const [isWebglUnavailable, setIsWebglUnavailable] = useState(false)

    const markWebglUnavailable = useCallback(() => setIsWebglUnavailable(true), [])

    useEffect(() => () => lightAnimationRef.current?.cancel(), [])

    const illuminate = useCallback((kind: 'correct' | 'miss', strength: number) => {
      const light = lightRef.current
      if (!light || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      light.dataset.kind = kind
      lightAnimationRef.current?.cancel()
      lightAnimationRef.current = light.animate(
        [{ opacity: Math.min(0.3, Math.max(0, strength) * 0.2) }, { opacity: 0 }],
        { duration: 650, easing: 'ease-out' },
      )
    }, [])

    useImperativeHandle(ref, () => ({
      pulse: (strength = 1.0) => {
        bgRef.current?.pulse(strength)
        illuminate('correct', strength)
      },
      flash: (kind, strength = 1.0) => {
        illuminate(kind, strength)
        const [r, g, b] = kind === 'correct' ? FRACTAL_FLASH_COLOR_CORRECT : FRACTAL_FLASH_COLOR_MISS
        const color: [number, number, number] = [
          r * FRACTAL_FLASH_BRIGHTNESS,
          g * FRACTAL_FLASH_BRIGHTNESS,
          b * FRACTAL_FLASH_BRIGHTNESS,
        ]
        bgRef.current?.flash(color, strength)
        // A correct hit also makes the fractal appear to zoom in for a moment.
        if (kind === 'correct') bgRef.current?.pulse(strength)
      },
      setSpinSpeed: (multiplier: number) => bgRef.current?.setRotationSpeedMultiplier(multiplier),
    }), [illuminate])

    return (
      <div className={`${styles.tiebreakerStage} ${isWebglUnavailable ? styles.webglUnavailable : ''}`}>
        {!isWebglUnavailable && (
          <BeatFractalBackground
            ref={bgRef}
            theme={theme}
            baseBrightness={FRACTAL_BASE_BRIGHTNESS}
            baseSaturation={FRACTAL_BASE_SATURATION}
            sizeIncrease={FRACTAL_SIZE_INCREASE}
            onUnavailable={markWebglUnavailable}
          />
        )}
        {word && <span className={styles.backgroundWord} aria-hidden="true">{word}</span>}
        <main className={styles.plane}>
          <div ref={lightRef} className={styles.beatLight} aria-hidden="true" />
          {roomLabel && <div className={`card-kicker ${styles.kicker}`}>{roomLabel}</div>}
          <h1 className={styles.textTilt}>Tiebreaker!</h1>
          {isWebglUnavailable && (
            <p className={`card ${styles.webglNotice}`} role="status">
              Animated background unavailable. Enable browser hardware acceleration to restore it.
            </p>
          )}
          {children}
        </main>
      </div>
    )
  },
)

TiebreakerStage.displayName = 'TiebreakerStage'
