import {
  createBrowserRouter,
  Navigate,
} from 'react-router'

import { TitleScreen } from './features/title/TitleScreen'
import { SetupScreen } from './features/setup/SetupScreen'
import { InviteRoomRoute } from './features/lobby/InviteRoomRoute'
import { DesignSystem } from './features/dev/DesignSystem'
import { GameplayScreen } from './features/gameplay/GameplayScreen'

/**
 * Routes (see docs/stories/00-app-scaffold/08-routing-react-router.md):
 *   /              title
 *   /setup         player setup + create/join room  (?join=<code> deep-link)
 *   /room/:code    invite-aware lobby entry
 *   /design-system design-system showcase (DEV builds only)
 *
 */
export const router = createBrowserRouter([
  { path: '/', element: <TitleScreen /> },
  { path: '/setup', element: <SetupScreen /> },
  { path: '/room/:code', element: <InviteRoomRoute /> },
  { path: '/room/:code/play', element: <GameplayScreen /> },
  ...(import.meta.env.DEV ? [{ path: '/design-system', element: <DesignSystem /> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
])
