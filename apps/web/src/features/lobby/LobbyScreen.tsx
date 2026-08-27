import { useParams } from 'react-router';

import { normalizeRoomCode } from '@wordle-clash/shared';

import { AppShell } from '../../ui/AppShell';
import styles from './LobbyScreen.module.scss';

/**
 * SCAFFOLD PLACEHOLDER. The RoomServer-backed lobby (player list, ready states,
 * game-mode toggle, favorite/copy, start dialog) lands in epic 06-lobby-screen,
 * on top of the realtime foundation (epic 02).
 */
export function LobbyScreen() {
  const { code } = useParams();
  const roomCode = normalizeRoomCode(code ?? '');

  return (
    <AppShell nav>
      <div className={styles.lobbyScreen}>
        <div className="card elev-md">
          <div className="card-kicker">Room code</div>
          <div className={`card-title ${styles.code}`}>{roomCode || '—'}</div>
          <div className="card-meta">Scaffold placeholder — see docs/stories/06-lobby-screen.</div>
        </div>
      </div>
    </AppShell>
  );
}
