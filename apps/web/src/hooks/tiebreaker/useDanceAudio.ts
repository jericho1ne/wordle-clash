import {
  useCallback,
  useEffect,
  useRef,
} from 'react'

/** Both routes own the same media lifecycle; only the room supplies a server start time. */
export function useDanceAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const play = useCallback(async (offsetSeconds = 0, rate = 1) => {
    const audio = audioRef.current
    if (!audio) throw new Error('Audio is not ready')
    audio.currentTime = Math.max(0, offsetSeconds)
    audio.playbackRate = rate
    await audio.play()
  }, [])
  const pause = useCallback(() => audioRef.current?.pause(), [])
  const clockMs = useCallback(() => (audioRef.current?.currentTime ?? 0) * 1000, [])

  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  return { audioRef, play, pause, clockMs }
}
