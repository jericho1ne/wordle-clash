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
