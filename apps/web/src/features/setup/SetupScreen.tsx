import { useNavigate, useSearchParams } from 'react-router';

import { IconButton } from '../../ui';
import styles from './SetupScreen.module.scss';

/**
 * SCAFFOLD PLACEHOLDER. Name field, avatar picker, create/join segmented
 * control, and conditional room-code field land in epic 05-setup-screen.
 */
export function SetupScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const join = params.get('join');

  return (
    <div className={`app-stage ${styles.setupScreen}`}>
      <div className="app-stage__inner">
        <IconButton aria-label="Back" className={styles.back} onClick={() => navigate('/')}>
          ‹
        </IconButton>
        <div className={styles.heading}>Set up your player</div>
        <p className={styles.note}>
          Scaffold placeholder — see docs/stories/05-setup-screen.
          {join ? ` Deep-link join code: ${join}` : ''}
        </p>
      </div>
    </div>
  );
}
