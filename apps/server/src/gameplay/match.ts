import {
  evaluateGuess,
  GAME_MODES,
  syncRoundDurationMs,
  type SyncRoundDurationMinutes,
  type EvaluatedGuess,
  type GameMode,
  type MatchSnapshot,
  type Player,
} from '@wordle-clash/shared'

export const MATCH_STORAGE_KEY = 'match'

export interface AuthoritativeMatch {
  mode: GameMode
  answer: string
  phase: MatchSnapshot['phase']
  round: number
  roundEndsAt: number | null
  syncRoundDurationMinutes: SyncRoundDurationMinutes
  guesses: Record<string, EvaluatedGuess[]>
  pendingGuesses: Record<string, EvaluatedGuess>
  eliminatedPlayerIds: string[]
  winnerId: string | null
  tiebreakPlayerIds: string[]
}

export function createMatch(
  mode: GameMode,
  answer: string,
  players: Player[],
  syncRoundDurationMinutes: SyncRoundDurationMinutes,
  now = Date.now(),
): AuthoritativeMatch {
  return {
    mode,
    answer,
    phase: 'active',
    round: 1,
    roundEndsAt: mode === 'sync' ? now + syncRoundDurationMs(syncRoundDurationMinutes) : null,
    syncRoundDurationMinutes,
    guesses: Object.fromEntries(players.map(({ id }) => [id, []])),
    pendingGuesses: {},
    eliminatedPlayerIds: [],
    winnerId: null,
    tiebreakPlayerIds: [],
  }
}

export function createMatchSnapshot(
  match: AuthoritativeMatch,
  players: Player[],
): MatchSnapshot {
  return {
    mode: match.mode,
    phase: match.phase,
    round: match.round,
    maxGuesses: GAME_MODES[match.mode].tries,
    roundEndsAt: match.roundEndsAt,
    players: players.map(({ id }) => ({
      playerId: id,
      guesses: match.guesses[id] ?? [],
      submitted: id in match.pendingGuesses,
      eliminated: match.eliminatedPlayerIds.includes(id),
    })),
    winnerId: match.winnerId,
    tiebreakPlayerIds: match.tiebreakPlayerIds,
    // A tie ends the match immediately (see Room#closeSyncRound), so nobody
    // still has an active guess left to spoil by revealing the word here —
    // every other connected player is already just spectating the dance-off.
    answer: match.phase === 'finished' || match.phase === 'tiebreak' ? match.answer : null,
  }
}

export function evaluateForMatch(match: AuthoritativeMatch, guess: string): EvaluatedGuess {
  return { word: guess, tiles: evaluateGuess(guess, match.answer) }
}

export function isCorrectGuess(guess: EvaluatedGuess): boolean {
  return guess.tiles.every((tile) => tile === 'correct')
}
