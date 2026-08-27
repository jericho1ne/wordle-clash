import type { ReactNode } from 'react';
import { Link } from 'react-router';

import styles from './AppShell.module.scss';

interface AppShellProps {
  /** Show the top nav bar with the wordmark. Off on the title screen. */
  nav?: boolean;
  children: ReactNode;
}

/**
 * The page shell for every routed screen: the radial-gradient ground, page
 * padding, an optional nav bar, and a centred 480px content column. Screens
 * render their own root-class element as the single child.
 */
export function AppShell({ nav = false, children }: AppShellProps) {
  return (
    <div className={styles.appShell}>
      {nav && (
        <nav className="nav">
          <Link to="/" className="nav-brand">
            Wordle Clash
          </Link>
        </nav>
      )}
      <div className={styles.stage}>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
}
