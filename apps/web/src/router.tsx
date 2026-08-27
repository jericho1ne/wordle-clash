import {
  createBrowserRouter,
  Navigate,
} from 'react-router'

import { TitleScreen } from './features/title/TitleScreen'
import { SetupScreen } from './features/setup/SetupScreen'
import { LobbyScreen } from './features/lobby/LobbyScreen'
import { DesignSystem } from './features/dev/DesignSystem'

/**
 * Routes (see docs/stories/00-app-scaffold/08-routing-react-router.md):
 *   /              title
 *   /setup         player setup + create/join room  (?join=<code> deep-link)
 *   /room/:code    lobby
 *   /design-system design-system showcase (DEV builds only)
 *
 * The deep-link guard on /room/:code (redirect to /setup?join=<code> when no
 * profile) lands in epic 06-lobby-screen; here the routes are just wired.
 */
export const router = createBrowserRouter([
  { path: '/', element: <TitleScreen /> },
  { path: '/setup', element: <SetupScreen /> },
  { path: '/room/:code', element: <LobbyScreen /> },
  ...(import.meta.env.DEV ? [{ path: '/design-system', element: <DesignSystem /> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
])
