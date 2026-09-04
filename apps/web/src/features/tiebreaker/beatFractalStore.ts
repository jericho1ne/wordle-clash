import { create } from 'zustand'

import type { ThemeName } from './beatFractalEngine'

interface BeatFractalState {
  theme: ThemeName
  bpm: number | null
  setTheme: (theme: ThemeName) => void
  setBpm: (bpm: number | null) => void
}

/**
 * Only "intent" state lives here — which theme is active, what BPM the
 * current song is. Do NOT put per-frame beat energy in Zustand: that would
 * trigger a React re-render on every beat. Instead call
 * bgRef.current.pulse() directly on a hit/beat event and let the WebGL loop
 * handle it outside React entirely.
 */
export const useBeatFractalStore = create<BeatFractalState>((set) => ({
  theme: 'neonArcade',
  bpm: null,
  setTheme: (theme) => set({ theme }),
  setBpm: (bpm) => set({ bpm }),
}))
