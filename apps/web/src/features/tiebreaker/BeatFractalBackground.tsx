import type { CSSProperties } from 'react'

import {
  forwardRef,
  useImperativeHandle,
} from 'react'

import type { ThemeName } from './beatFractalEngine'
import type { BeatFractalEngine } from './beatFractalEngine'
import {
  useBeatFractal,
  useBeatFractalTheme,
} from './useBeatFractal'

export interface BeatFractalBackgroundProps {
  theme?: ThemeName
  baseBrightness?: number
  baseSaturation?: number
  sizeIncrease?: number
  className?: string
  style?: CSSProperties
}

export interface BeatFractalHandle {
  pulse: (strength?: number) => void
  flash: (colorRgb: [number, number, number], strength?: number) => void
  setBPM: (bpm: number) => void
  stopBPM: () => void
  setTheme: (theme: ThemeName) => void
  setJulia: (on: boolean) => void
  setRotationSpeedMultiplier: (multiplier: number) => void
  retarget: () => void
  connectAudio: (audioEl: HTMLAudioElement) => Promise<void> | void
}

/**
 * Drop this behind a game screen:
 *
 *   const bgRef = useRef<BeatFractalHandle>(null)
 *   <BeatFractalBackground ref={bgRef} theme="neonArcade" />
 *   ...
 *   bgRef.current?.pulse(1.0)   // call from a hit-detection / socket handler
 *
 * `theme` can also be driven straight from a Zustand selector — beat pulses
 * themselves stay fully imperative and never go through React state (see
 * beatFractalStore.ts).
 */
export const BeatFractalBackground = forwardRef<BeatFractalHandle, BeatFractalBackgroundProps>(
  ({ theme = 'neonArcade', baseBrightness, baseSaturation, sizeIncrease, className, style }, ref) => {
    const { canvasRef, engineRef } = useBeatFractal({ theme, baseBrightness, baseSaturation, sizeIncrease })
    useBeatFractalTheme(engineRef, theme)

    useImperativeHandle(ref, () => ({
      pulse: (strength = 1.0) => engineRef.current?.pulse(strength),
      flash: (colorRgb: [number, number, number], strength = 1.0) => engineRef.current?.flash(colorRgb, strength),
      setBPM: (bpm: number) => engineRef.current?.setBPM(bpm),
      stopBPM: () => engineRef.current?.stopBPM(),
      setTheme: (t: ThemeName) => engineRef.current?.setTheme(t),
      setJulia: (on: boolean) => engineRef.current?.setJulia(on),
      setRotationSpeedMultiplier: (multiplier: number) => engineRef.current?.setRotationSpeedMultiplier(multiplier),
      retarget: () => engineRef.current?.retarget(),
      connectAudio: (audioEl: HTMLAudioElement) => engineRef.current?.connectAudio(audioEl),
    }), [engineRef])

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
          zIndex: -1,
          ...style,
        }}
      />
    )
  },
)

BeatFractalBackground.displayName = 'BeatFractalBackground'

export type { BeatFractalEngine }
