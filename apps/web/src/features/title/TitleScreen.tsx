import { useNavigate } from 'react-router'

import { Button } from '../../ui'
import styles from './TitleScreen.module.scss'

/**
 * SCAFFOLD PLACEHOLDER. The faithful port (animated CLASH tiles, wordmark,
 * tagline, Play CTA) lands in epic 04-title-setup-screens.
 */
export function TitleScreen() {
  const navigate = useNavigate()

  return (
    <div className={`app-stage ${styles.titleScreen}`}>
      <div className="app-stage__inner">
        <div className={styles.kicker}>GET READY FOR...</div>
        <div className={styles.wordmark}>Wordle Clash</div>
        <p className={styles.tagline}>
          Your fave civilized game is now a chaotic multiplayer experience.
        </p>
        <Button block onClick={() => navigate('/setup')}>
          Play
        </Button>
        <p className={styles.note}>
          Scaffold placeholder — see docs/stories/04-title-setup-screens.
        </p>
      </div>
    </div>
  )
}
