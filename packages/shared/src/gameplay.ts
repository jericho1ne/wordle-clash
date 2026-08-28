import type { GameMode } from './game-modes.js'

export const WORD_LENGTH = 5
export const SYNC_ROUND_MS = 60_000
export const SYNC_GRACE_MS = 400

export type TileMark = 'correct' | 'present' | 'absent'
export type MatchPhase = 'active' | 'finished' | 'tiebreak'

export interface EvaluatedGuess {
  word: string
  tiles: TileMark[]
}

export interface MatchPlayerState {
  playerId: string
  guesses: EvaluatedGuess[]
  submitted: boolean
  eliminated: boolean
}

export interface MatchSnapshot {
  mode: GameMode
  phase: MatchPhase
  round: number
  maxGuesses: number
  roundEndsAt: number | null
  players: MatchPlayerState[]
  winnerId: string | null
  tiebreakPlayerIds: string[]
  answer: string | null
}

export function normalizeGuess(value: string): string {
  return value.trim().toUpperCase()
}

export function isValidGuess(value: string): boolean {
  return /^[A-Z]{5}$/.test(normalizeGuess(value))
}

/** Standard Wordle evaluation: exact matches consume letters before present matches. */
export function evaluateGuess(guessValue: string, answerValue: string): TileMark[] {
  const guess = normalizeGuess(guessValue)
  const answer = normalizeGuess(answerValue)
  if (!isValidGuess(guess) || !isValidGuess(answer)) {
    throw new Error('Guesses and answers must be five letters')
  }

  const tiles: TileMark[] = Array.from({ length: WORD_LENGTH }, () => 'absent')
  const remaining = new Map<string, number>()

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      tiles[index] = 'correct'
    } else {
      const letter = answer[index]
      if (letter) remaining.set(letter, (remaining.get(letter) ?? 0) + 1)
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (tiles[index] === 'correct') continue
    const letter = guess[index]
    const count = letter ? remaining.get(letter) ?? 0 : 0
    if (letter && count > 0) {
      tiles[index] = 'present'
      remaining.set(letter, count - 1)
    }
  }

  return tiles
}
