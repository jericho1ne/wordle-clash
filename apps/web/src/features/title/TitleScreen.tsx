import { useNavigate } from 'react-router';

import { AppShell } from '../../ui/AppShell';
import styles from './TitleScreen.module.scss';

/**
 * SCAFFOLD PLACEHOLDER. The faithful port (animated CLASH tiles, wordmark,
 * tagline, Play CTA) lands in epic 04-title-screen.
 */
export function TitleScreen() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className={styles.titleScreen}>
        <div className={styles.kicker}>GET READY FOR...</div>
        <div className={styles.wordmark}>Wordle Clash</div>
        <p className={styles.tagline}>
          Your fave civilized game is now a chaotic multiplayer experience.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => navigate('/setup')}
        >
          Play
        </button>
        <p className={styles.note}>Scaffold placeholder — see docs/stories/04-title-screen.</p>
      </div>
    </AppShell>
  );
}
