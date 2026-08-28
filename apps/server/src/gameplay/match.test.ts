import {
  describe,
  expect,
  it,
} from 'vitest'

import type { Player } from '@wordle-clash/shared'

import {
  createMatch,
  createMatchSnapshot,
  evaluateForMatch,
  isCorrectGuess,
} from './match'
import {
  isAllowedGuess,
  selectAnswer,
} from './answers'

const players: Player[] = [
  {
    id: 'one',
    name: 'One',
    avatarId: 0,
    animalId: 0,
    isHost: true,
    ready: true,
    connected: true,
    joinedAt: 1,
  },
]

describe('authoritative match', () => {
  it('accepts a deterministic answer for local and integration tests', () => {
    expect(selectAnswer('clash')).toBe('CLASH')
  })

  it('selects from the complete server-only answer pool', () => {
    expect(selectAnswer(undefined, () => 0)).toBe('ABACK')
    expect(selectAnswer(undefined, () => 0.999_999)).toBe('ZONAL')
  })

  it('accepts listed words and rejects arbitrary five-letter strings', () => {
    expect(isAllowedGuess('crane')).toBe(true)
    expect(isAllowedGuess('qzxjk')).toBe(false)
  })

  it('never includes an active answer in a client snapshot', () => {
    const match = createMatch('realtime', 'CLASH', players, 1_000)
    expect(createMatchSnapshot(match, players).answer).toBeNull()
  })

  it('evaluates correctness against the server-only answer', () => {
    const match = createMatch('realtime', 'CLASH', players, 1_000)
    expect(isCorrectGuess(evaluateForMatch(match, 'CLASH'))).toBe(true)
    expect(isCorrectGuess(evaluateForMatch(match, 'CLOUD'))).toBe(false)
  })
})
