import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluateGuess,
  isValidGuess,
  normalizeGuess,
} from './gameplay'

describe('gameplay', () => {
  it('normalizes and validates five-letter guesses without a dictionary', () => {
    expect(normalizeGuess('  qzxjk ')).toBe('QZXJK')
    expect(isValidGuess('qzxjk')).toBe(true)
    expect(isValidGuess('four')).toBe(false)
    expect(isValidGuess('12345')).toBe(false)
  })

  it('consumes duplicate answer letters exactly once', () => {
    expect(evaluateGuess('APPLE', 'PEARL')).toEqual([
      'present',
      'present',
      'absent',
      'present',
      'present',
    ])
  })

  it('prioritizes correct positions before present positions', () => {
    expect(evaluateGuess('EERIE', 'SERVE')).toEqual([
      'absent',
      'correct',
      'correct',
      'absent',
      'correct',
    ])
  })
})
