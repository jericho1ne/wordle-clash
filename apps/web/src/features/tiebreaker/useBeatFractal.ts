import type { MutableRefObject } from 'react'

import {
  useEffect,
  useRef,
} from 'react'

import type {
  BeatFractalOptions,
  ThemeName,
} from './beatFractalEngine'
import { BeatFractalEngine } from './beatFractalEngine'

/**
 * Mounts the engine on a canvas and hands back a stable ref to it.
 * Deliberately does NOT put beatEnergy/rotation/etc. in React state —
 * those change every frame, and this keeps the WebGL loop fully outside
 * React's render cycle. Call methods on engineRef.current imperatively
 * (from socket handlers, key handlers, etc.).
 */
export function useBeatFractal(options: BeatFractalOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<BeatFractalEngine | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BeatFractalEngine(canvasRef.current, options)
    engineRef.current = engine
    engine.start()
    return () => {
      engine.destroy()
      // Wait a tick before freeing the WebGL context: React's dev-mode
      // double-mount would already have made a new engine on this same
      // canvas by then. If engineRef still points at this one, nothing
      // took over, so it's safe to actually free the context.
      window.setTimeout(() => {
        if (engineRef.current !== engine) return
        engine.releaseContext()
        engineRef.current = null
      }, 0)
    }
    // engine is created once; use engineRef.current.setTheme() etc. to change it later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { canvasRef, engineRef }
}

/** Convenience: change theme when a Zustand-tracked value changes, without recreating the whole engine. */
export function useBeatFractalTheme(
  engineRef: MutableRefObject<BeatFractalEngine | null>,
  theme: ThemeName,
) {
  useEffect(() => {
    engineRef.current?.setTheme(theme)
  }, [engineRef, theme])
}
