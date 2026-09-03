import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  DANCE_OFF_GOOD_WINDOW_MS,
  DANCE_OFF_PERFECT_WINDOW_MS,
  judgeDanceHit,
} from './dance-off'

describe('judgeDanceHit', () => {
  it('is perfect within the perfect window, on either side', () => {
    expect(judgeDanceHit(0)).toBe('perfect')
    expect(judgeDanceHit(DANCE_OFF_PERFECT_WINDOW_MS)).toBe('perfect')
    expect(judgeDanceHit(-DANCE_OFF_PERFECT_WINDOW_MS)).toBe('perfect')
  })

  it('is good just outside the perfect window and within the good window', () => {
    expect(judgeDanceHit(DANCE_OFF_PERFECT_WINDOW_MS + 1)).toBe('good')
    expect(judgeDanceHit(DANCE_OFF_GOOD_WINDOW_MS)).toBe('good')
  })

  it('is a miss beyond the good window', () => {
    expect(judgeDanceHit(DANCE_OFF_GOOD_WINDOW_MS + 1)).toBe('miss')
  })
})
