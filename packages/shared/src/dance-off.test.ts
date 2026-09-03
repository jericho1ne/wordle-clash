import {
  describe,
  expect,
  it,
} from 'vitest'

import type { Beatmap } from './beatmap'
import {
  DANCE_OFF_CLIP_MS,
  DANCE_OFF_GOOD_WINDOW_MS,
  DANCE_OFF_PERFECT_WINDOW_MS,
  danceOffClip,
  judgeDanceHit,
  judgeSubmittedHit,
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

describe('judgeSubmittedHit', () => {
  const entries = [
    { timeMs: 1000, lane: 'left' as const },
    { timeMs: 3000, lane: 'left' as const },
  ]

  it('matches and judges the nearest entry in the lane', () => {
    expect(judgeSubmittedHit(entries, 'left', 1010)).toEqual({
      judgment: 'perfect',
      matchedEntry: { timeMs: 1000, lane: 'left' },
    })
  })

  it('reports a miss with no matched entry when nothing is in range', () => {
    expect(judgeSubmittedHit(entries, 'left', 5000)).toEqual({ judgment: 'miss', matchedEntry: null })
  })

  it('reports a miss when the lane has no entries at all', () => {
    expect(judgeSubmittedHit(entries, 'down', 1000)).toEqual({ judgment: 'miss', matchedEntry: null })
  })
})

describe('danceOffClip', () => {
  it('keeps only entries within the fixed clip length, re-timed from 0', () => {
    const beatmap: Beatmap = {
      trackPath: 'audio/test.mp3',
      durationMs: 60_000,
      entries: [
        { timeMs: 500, lane: 'left' },
        { timeMs: DANCE_OFF_CLIP_MS - 1, lane: 'down' },
        { timeMs: DANCE_OFF_CLIP_MS + 500, lane: 'left' },
      ],
    }
    expect(danceOffClip(beatmap)).toEqual([
      { timeMs: 500, lane: 'left' },
      { timeMs: DANCE_OFF_CLIP_MS - 1, lane: 'down' },
    ])
  })
})
