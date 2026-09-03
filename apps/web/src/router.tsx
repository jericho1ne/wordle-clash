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

/**
 * Routes (see docs/stories/00-app-scaffold/08-routing-react-router.md):
 *   /                title
 *   /setup           player setup + create/join room  (?join=<code> deep-link)
 *   /room/:code      invite-aware lobby entry
 *   /design-system   design-system showcase (DEV builds only)
 *   /beatmap-preview beat map visual/audio scrub tool (DEV builds only,
 *                    docs/stories/08-beatmap-engine)
 *   /tiebreaker      DDR dance-off playground (DEV builds only,
 *                    docs/stories/09-tiebreaker-battle) — the real, guarded
 *                    battle lives at /room/:code/tiebreaker (story 09-04)
 *
 */
export const router = createBrowserRouter([
  { path: '/', element: <TitleScreen /> },
  { path: '/setup', element: <SetupScreen /> },
  { path: '/room/:code', element: <InviteRoomRoute /> },
  { path: '/room/:code/play', element: <GameplayScreen /> },
  ...(import.meta.env.DEV
    ? [
        { path: '/design-system', element: <DesignSystem /> },
        { path: '/beatmap-preview', element: <BeatmapPreview /> },
        { path: '/tiebreaker', element: <TiebreakerPlaygroundScreen /> },
      ]
    : []),
  { path: '*', element: <Navigate to="/" replace /> },
])
