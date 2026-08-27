import { createBrowserRouter, Navigate } from 'react-router';

import { TitleScreen } from './features/title/TitleScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { LobbyScreen } from './features/lobby/LobbyScreen';

/**
 * Routes (see docs/stories/00-app-scaffold/08-routing-react-router.md):
 *   /            title
 *   /setup       player setup + create/join room  (?join=<code> deep-link)
 *   /room/:code  lobby
 *
 * The deep-link guard on /room/:code (redirect to /setup?join=<code> when no
 * profile) lands in epic 06-lobby-screen; here the routes are just wired.
 */
export const router = createBrowserRouter([
  { path: '/', element: <TitleScreen /> },
  { path: '/setup', element: <SetupScreen /> },
  { path: '/room/:code', element: <LobbyScreen /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
