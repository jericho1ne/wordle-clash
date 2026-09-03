import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  Beatmap,
  Lane,
} from '@wordle-clash/shared'

import { DEFAULT_PLAYBACK_RATE } from '../../constants'
import { PlaybackSpeedSlider } from '../../ui'
import styles from './BeatmapPreview.module.scss'

const TRACK_SRC = '/audio/canto-de-ossanha.mp3'
const BEATMAP_SRC = '/audio/canto-de-ossanha.beatmap.json'
const LANES: readonly Lane[] = ['left', 'down', 'right']
const LANE_LABEL: Record<Lane, string> = { down: '↓', left: '←', right: '→' }
const LOOKAHEAD_MS = 2200
const HIT_FLASH_MS = 120

/**
 * Story 08-03 — dev-only preview (route `/beatmap-preview`, DEV builds only)
 * that plays the track and scrolls the generated beatmap toward a hit line,
 * so kick (down), snare (left), and hi-hat/broadband (right) onsets can be
 * confirmed by ear and eye before Epic 09 builds real dance-off gameplay on
 * top of them.
 */
export function BeatmapPreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flashRefs = useRef<Record<Lane, number>>({ down: 0, left: 0, right: 0 })
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  const entriesByLane = useMemo(() => {
    const grouped: Record<Lane, number[]> = { down: [], left: [], right: [] }
    for (const entry of beatmap?.entries ?? []) grouped[entry.lane].push(entry.timeMs)
    return grouped
  }, [beatmap])

  useEffect(() => {
    if (!beatmap) return
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas || !audio) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const laneWidth = canvas.width / LANES.length
    const hitLineY = canvas.height - 40

    const draw = () => {
      const nowMs = audio.currentTime * 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      LANES.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth
        const flashUntil = flashRefs.current[lane]
        const flashing = nowMs < flashUntil

        ctx.fillStyle = flashing ? 'rgba(132, 220, 198, 0.35)' : 'rgba(255, 255, 255, 0.04)'
        ctx.fillRect(x, 0, laneWidth - 4, canvas.height)

        ctx.strokeStyle = flashing ? '#84DCC6' : 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = flashing ? 4 : 2
        ctx.strokeRect(x + 2, hitLineY, laneWidth - 8, 6)

        for (const timeMs of entriesByLane[lane]) {
          const delta = timeMs - nowMs
          if (delta < -HIT_FLASH_MS || delta > LOOKAHEAD_MS) continue
          if (delta <= HIT_FLASH_MS && delta > -HIT_FLASH_MS) flashRefs.current[lane] = Math.max(flashUntil, nowMs + HIT_FLASH_MS)
          const progress = 1 - delta / LOOKAHEAD_MS
          const y = progress * hitLineY
          ctx.fillStyle = '#F0803C'
          ctx.fillRect(x + laneWidth / 2 - 18, y - 8, 36, 16)
        }
      })

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [beatmap, entriesByLane])

  return (
    <div className={styles.beatmapPreview}>
      <h1>Beat map preview</h1>
      <p>{TRACK_SRC} — {beatmap ? `${beatmap.entries.length} entries, ${(beatmap.durationMs / 1000).toFixed(1)}s` : 'loading…'}</p>
      {error && <p className={styles.error}>Failed to load beatmap: {error}</p>}

      <audio ref={audioRef} src={TRACK_SRC} controls className={styles.audio} />

      <PlaybackSpeedSlider value={playbackRate} onChange={setPlaybackRate} />

      <div className={styles.laneLabels}>
        {LANES.map((lane) => <span key={lane}>{LANE_LABEL[lane]}</span>)}
      </div>
      <canvas ref={canvasRef} width={480} height={520} className={styles.canvas} />
    </div>
  )
}
