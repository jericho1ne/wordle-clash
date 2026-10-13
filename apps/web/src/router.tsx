import {
  createBrowserRouter,
  Navigate,
} from 'react-router'

import { TitleScreen } from './pages/title/TitleScreen'
import { SetupScreen } from './pages/setup/SetupScreen'
import { InviteRoomRoute } from './pages/lobby/InviteRoomRoute'
import { DesignSystem } from './pages/dev/DesignSystem'
import { BeatmapPreview } from './pages/dev/BeatmapPreview'
import { GameplayScreen } from './pages/gameplay/GameplayScreen'
import { TiebreakerPlaygroundScreen } from './pages/tiebreaker/TiebreakerPlaygroundScreen'
import { TiebreakerRoomScreen } from './pages/tiebreaker/TiebreakerRoomScreen'

// All app routes. /beatmap-preview and /tiebreaker are dev tools that are
// live in production for now — see docs/stories/08-beatmap-engine and
// docs/stories/09-tiebreaker-battle.
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
