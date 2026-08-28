import {
  isValidGuess,
  normalizeGuess,
} from '@wordle-clash/shared'

import validWordleWords from './valid-wordle-words.txt'
import wordleAnswers from './wordle-answers.txt'

const VALID_GUESSES = new Set(validWordleWords
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => word.toUpperCase()))

const ANSWERS = wordleAnswers
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => word.toUpperCase())

export function selectAnswer(forcedAnswer?: string, random = Math.random): string {
  if (forcedAnswer) {
    const normalized = normalizeGuess(forcedAnswer)
    if (!isAllowedGuess(normalized)) {
      throw new Error('GAMEPLAY_TEST_ANSWER must be in the allowed word list')
    }
    return normalized
  }

  const answer = ANSWERS[Math.floor(random() * ANSWERS.length)]
  if (!answer || !isAllowedGuess(answer)) throw new Error('The answer pool is invalid')
  return answer
}

export function isAllowedGuess(value: string): boolean {
  const normalized = normalizeGuess(value)
  return isValidGuess(normalized) && VALID_GUESSES.has(normalized)
}
