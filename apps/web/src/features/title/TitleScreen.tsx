import { useNavigate } from 'react-router'

import { Button } from '../../ui'
import styles from './TitleScreen.module.scss'

const WORDLE_TILES = [
  { letter: 'W', state: 'absent' },
  { letter: 'O', state: 'absent' },
  { letter: 'R', state: 'absent' },
  { letter: 'D', state: 'absent' },
  { letter: 'L', state: 'present' },
  { letter: 'E', state: 'absent' },
] as const

const CLASH_TILES = [
  { letter: 'C', state: 'absent' },
  { letter: 'L', state: 'correct' },
  { letter: 'A', state: 'correct' },
  { letter: 'S', state: 'present' },
  { letter: 'H', state: 'absent' },
] as const

export function TitleScreen() {
  const navigate = useNavigate()

  return (
    <div className={`app-stage ${styles.titleScreen}`}>
      <div className="app-stage__inner">
        <div className={styles.logo} aria-hidden="true">
          <div className={`${styles.tiles} ${styles.wordleTiles}`}>
            {WORDLE_TILES.map(({ letter, state }) => (
              <span
                key={letter}
                className={`${styles.tile} title-tile-flip`}
                data-state={state}
              >
                {letter}
              </span>
            ))}
          </div>
          <div className={`${styles.tiles} ${styles.clashTiles}`}>
            {CLASH_TILES.map(({ letter, state }) => (
              <span
                key={letter}
                className={`${styles.tile} title-tile-flip`}
                data-state={state}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.subtitle}>Multiplayer</div>
        <p className={styles.tagline}>
          Sometimes brute force beats... brain force
        </p>
        <Button
          block
          trailingIcon={<span aria-hidden="true">→</span>}
          onClick={() => navigate('/setup')}
        >
          Play
        </Button>
      </div>
    </div>
  )
}
