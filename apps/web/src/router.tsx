import {
  createBrowserRouter,
  Navigate,
} from 'react-router'

import { TitleScreen } from './features/title/TitleScreen'
import { SetupScreen } from './features/setup/SetupScreen'
import { InviteRoomRoute } from './features/lobby/InviteRoomRoute'
import { DesignSystem } from './features/dev/DesignSystem'
import { BeatmapPreview } from './features/dev/BeatmapPreview'
import { GameplayScreen } from './features/gameplay/GameplayScreen'
import { TiebreakerPlaygroundScreen } from './features/tiebreaker/TiebreakerPlaygroundScreen'
import { TiebreakerRoomScreen } from './features/tiebreaker/TiebreakerRoomScreen'

/**
 * Routes (see docs/stories/00-app-scaffold/08-routing-react-router.md):
 *   /                    title
 *   /setup               player setup + create/join room  (?join=<code> deep-link)
 *   /room/:code          invite-aware lobby entry
 *   /room/:code/play     active match (redirects here to /tiebreaker on a tie)
 *   /room/:code/tiebreaker  the real DDR dance-off — tied players play,
 *                        everyone else spectates (docs/stories/09-tiebreaker-battle)
 *   /design-system       design-system showcase (DEV builds only)
 *   /beatmap-preview     beat map visual/audio scrub tool — deliberately
 *                        shipped to production for now so people can test
 *                        it on the deployed URL; DEV-gate it again before
 *                        general release (docs/stories/08-beatmap-engine)
 *   /tiebreaker          DDR dance-off playground, no server involved —
 *                        same deliberate temporary production exposure as
 *                        /beatmap-preview above (docs/stories/09-tiebreaker-battle)
 *
 */
export const router = createBrowserRouter([
  { path: '/', element: <TitleScreen /> },
  { path: '/setup', element: <SetupScreen /> },
  { path: '/room/:code', element: <InviteRoomRoute /> },
  { path: '/room/:code/play', element: <GameplayScreen /> },
  { path: '/room/:code/tiebreaker', element: <TiebreakerRoomScreen /> },
  { path: '/beatmap-preview', element: <BeatmapPreview /> },
  { path: '/tiebreaker', element: <TiebreakerPlaygroundScreen /> },
  ...(import.meta.env.DEV
    ? [{ path: '/design-system', element: <DesignSystem /> }]
    : []),
  { path: '*', element: <Navigate to="/" replace /> },
])
