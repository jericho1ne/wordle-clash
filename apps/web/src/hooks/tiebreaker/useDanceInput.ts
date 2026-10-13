import type { Lane } from '@wordle-clash/shared'
import { useEffect } from 'react'

export const LETTER_KEYS: Record<string, Lane> = { a: 'left', s: 'down', d: 'right' }
export const ARROW_KEYS: Record<string, Lane> = { ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right' }

export function useDanceInput(
  keyToLane: Record<string, Lane>,
  enabled: boolean,
  clockMs: () => number,
  onHit: (lane: Lane, timeMs: number) => void,
) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, button, [contenteditable], dialog')) return
      const lane = keyToLane[event.key] ?? keyToLane[event.key.toLowerCase()]
      if (!lane) return
      event.preventDefault()
      onHit(lane, clockMs())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [keyToLane, enabled, clockMs, onHit])
}
