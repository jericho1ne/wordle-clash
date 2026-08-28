import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Toggle } from '../../ui'
import styles from './LobbyMusic.module.scss'

const LOBBY_MUSIC_VOLUME = 0.15

export function LobbyMusic() {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const startMusic = useCallback(async () => {
    if (!audio.current) return

    try {
      await audio.current.play()
      setPlaying(true)
      setUnavailable(false)
    }
    catch {
      setPlaying(false)
    }
  }, [])

  useEffect(() => {
    if (!audio.current) return

    audio.current.volume = LOBBY_MUSIC_VOLUME
    void startMusic()
  }, [startMusic])

  const toggleMusic = (nextPlaying: boolean) => {
    if (nextPlaying) {
      void startMusic()
      return
    }

    audio.current?.pause()
    setPlaying(false)
  }

  return (
    <aside className={styles.lobbyMusic} aria-label="Lobby music">
      <audio
        ref={audio}
        src="/lobby-music.mp3"
        autoPlay
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false)
          setUnavailable(true)
        }}
      >
        Your browser does not support lobby music.
      </audio>
      <Toggle
        pressed={playing}
        disabled={unavailable}
        aria-label="Play lobby music"
        onPressedChange={toggleMusic}
      >
        {unavailable ? 'Music unavailable' : playing ? 'Music playing' : 'Play music'}
      </Toggle>
    </aside>
  )
}
