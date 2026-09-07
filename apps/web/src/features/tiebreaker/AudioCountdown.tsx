import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

import styles from './AudioCountdown.module.scss'

interface AudioCountdownProps {
  audioRef: RefObject<HTMLAudioElement | null>
}

/** Draws the remaining time from the audio element's full media duration. */
export function AudioCountdown({ audioRef }: AudioCountdownProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const displayedSecondRef = useRef<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!audio || !canvas || !ctx) return
    const tokens = getComputedStyle(canvas)
    const track = tokens.getPropertyValue('--color-neutral-800').trim()
    const accent = tokens.getPropertyValue('--color-accent-400').trim()
    let frame = 0
    const update = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
      const left = Math.max(0, duration - audio.currentTime)
      const seconds = duration ? Math.ceil(left) : null
      if (displayedSecondRef.current !== seconds) {
        displayedSecondRef.current = seconds
        setRemaining(seconds)
      }
      ctx.clearRect(0, 0, 192, 192)
      ctx.lineWidth = 14
      ctx.strokeStyle = track
      ctx.beginPath()
      ctx.arc(96, 96, 84, 0, Math.PI * 2)
      ctx.stroke()
      if (duration && left > 0) {
        ctx.strokeStyle = accent
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(96, 96, 84, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left / duration)
        ctx.stroke()
      }
      frame = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(frame)
  }, [audioRef])

  const label = remaining === null ? '—:—' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
  return (
    <div className={styles.audioCountdown} role="timer" aria-label={`${label} remaining`}>
      <canvas ref={canvasRef} width={192} height={192} aria-hidden="true" />
      <div className={styles.label}>{label}<span>left</span></div>
    </div>
  )
}
