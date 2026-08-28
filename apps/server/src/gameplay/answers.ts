import {
  isValidGuess,
  normalizeGuess,
} from '@wordle-clash/shared'

const ANSWERS = [
  'APPLE', 'BEACH', 'BLAZE', 'BRAVE', 'BRICK', 'CHARM', 'CLASH', 'CLOUD',
  'CORAL', 'CRANE', 'DANCE', 'EMBER', 'FLAME', 'FROST', 'GIANT', 'GRAPE',
  'HEART', 'LIGHT', 'MAGIC', 'MANGO', 'NIGHT', 'OCEAN', 'PARTY', 'PEARL',
  'PIXEL', 'PLANT', 'QUEST', 'RIVER', 'ROBOT', 'SHINE', 'SPARK', 'STORM',
  'TIGER', 'TOAST', 'WATER', 'WHALE', 'WORLD', 'ZEBRA',
] as const

export function selectAnswer(forcedAnswer?: string, random = Math.random): string {
  if (forcedAnswer) {
    const normalized = normalizeGuess(forcedAnswer)
    if (!isValidGuess(normalized)) {
      throw new Error('GAMEPLAY_TEST_ANSWER must contain exactly five letters')
    }
    return normalized
  }

  const answer = ANSWERS[Math.floor(random() * ANSWERS.length)]
  if (!answer || !isValidGuess(answer)) throw new Error('The answer pool is invalid')
  return answer
}
