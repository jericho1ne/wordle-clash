import { useNavigate } from 'react-router'

import { Button } from '../../ui'
import styles from './TitleScreen.module.scss'

const LOGO_TILES = [
  { letter: 'C', state: 'absent' },
  { letter: 'L', state: 'present' },
  { letter: 'A', state: 'correct' },
  { letter: 'S', state: 'present' },
  { letter: 'H', state: 'correct' },
] as const

export function TitleScreen() {
  const navigate = useNavigate()

  return (
    <div className={`app-stage ${styles.titleScreen}`}>
      <div className="app-stage__inner">
        <div className={styles.tiles} aria-hidden="true">
          {LOGO_TILES.map(({ letter, state }) => (
            <span
              key={letter}
              className={`${styles.tile} title-tile-flip`}
              data-state={state}
            >
              {letter}
            </span>
          ))}
        </div>
        <div className={styles.kicker}>Multiplayer</div>
        <h1 className={styles.wordmark}>Wordle Clash</h1>
        <p className={styles.tagline}>
          Race friends to the word. Tie for first? Settle it in a bboy dance-off.
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
