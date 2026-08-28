/**
 * Game modes — copy is ported verbatim from the "Wordle Royale" design
 * prototype. Gameplay for these modes is NOT implemented in Phase 1; only the
 * lobby selector and the "Match starting" dialog consume this.
 */
export type GameMode = 'sync' | 'realtime'

export interface GameModeInfo {
  readonly id: GameMode
  /** Segmented-control label. */
  readonly label: string
  /** Guess attempts allowed in this mode. */
  readonly tries: number
  /** Lobby description paragraph (exact prototype text, tries prefix included). */
  readonly description: string
}

export const GAME_MODES: Record<GameMode, GameModeInfo> = {
  sync: {
    id: 'sync',
    label: 'Synchronous',
    tries: 5,
    description:
      '5 tries. Everyone submits a guess within 1 minute, then all guesses reveal together. Multiple correct guesses at once trigger a bboy dance-off to decide the winner.',
  },
  realtime: {
    id: 'realtime',
    label: 'Real-time',
    tries: 10,
    description:
      '10 tries. Guess as fast as you like — first player to nail the word wins the round.',
  },
}

export const GAME_MODE_IDS = ['sync', 'realtime'] as const satisfies readonly GameMode[]

export const DEFAULT_GAME_MODE: GameMode = 'sync'

export function isGameMode(value: unknown): value is GameMode {
  return value === 'sync' || value === 'realtime'
}
