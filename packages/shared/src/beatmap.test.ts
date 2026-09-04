import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  assertValidBeatmap,
  BEATMAP_MIN_GAP_MS,
  type Beatmap,
  findNearestEntryInLane,
  hasPlayableGaps,
  isSortedByTime,
  parseBeatmap,
  sliceBeatmapClip,
  usesAllLanes,
} from './beatmap'

function beatmap(entries: Beatmap['entries'], durationMs = 20_000): Beatmap {
  return { trackPath: 'audio/test.mp3', durationMs, entries }
}

describe('beatmap schema', () => {
  it('parses a well-formed beatmap', () => {
    const parsed = parseBeatmap(beatmap([
      { timeMs: 0, lane: 'down' },
      { timeMs: 500, lane: 'left' },
    ]))
    expect(parsed.entries).toHaveLength(2)
  })

  it('rejects an unknown lane', () => {
    expect(() => parseBeatmap(beatmap([{ timeMs: 0, lane: 'up' as never }]))).toThrow()
  })

  it('rejects a negative timeMs', () => {
    expect(() => parseBeatmap(beatmap([{ timeMs: -1, lane: 'down' }]))).toThrow()
  })
})

describe('isSortedByTime', () => {
  it('is true for strictly ascending entries', () => {
    expect(isSortedByTime([
      { timeMs: 0, lane: 'left' },
      { timeMs: 200, lane: 'down' },
    ])).toBe(true)
  })

  it('is false for out-of-order or duplicate timestamps', () => {
    expect(isSortedByTime([
      { timeMs: 200, lane: 'left' },
      { timeMs: 0, lane: 'down' },
    ])).toBe(false)
    expect(isSortedByTime([
      { timeMs: 100, lane: 'left' },
      { timeMs: 100, lane: 'down' },
    ])).toBe(false)
  })
})

describe('hasPlayableGaps', () => {
  it('is true when every gap is at least the minimum', () => {
    expect(hasPlayableGaps([
      { timeMs: 0, lane: 'left' },
      { timeMs: BEATMAP_MIN_GAP_MS, lane: 'down' },
    ])).toBe(true)
  })

  it('is false when two entries are closer than the minimum gap', () => {
    expect(hasPlayableGaps([
      { timeMs: 0, lane: 'left' },
      { timeMs: BEATMAP_MIN_GAP_MS - 1, lane: 'down' },
    ])).toBe(false)
  })
})

describe('usesAllLanes', () => {
  it('is false when a lane never appears', () => {
    expect(usesAllLanes([
      { timeMs: 0, lane: 'left' },
      { timeMs: 200, lane: 'down' },
    ])).toBe(false)
  })

  it('is true when all three lanes appear', () => {
    expect(usesAllLanes([
      { timeMs: 0, lane: 'left' },
      { timeMs: 200, lane: 'down' },
      { timeMs: 400, lane: 'right' },
    ])).toBe(true)
  })
})

describe('assertValidBeatmap', () => {
  it('throws when entries are unsorted', () => {
    expect(() => assertValidBeatmap(beatmap([
      { timeMs: 500, lane: 'left' },
      { timeMs: 0, lane: 'down' },
    ]))).toThrow(/sorted/)
  })

  it('throws when a gap is too small', () => {
    expect(() => assertValidBeatmap(beatmap([
      { timeMs: 0, lane: 'left' },
      { timeMs: 10, lane: 'down' },
    ]))).toThrow(/apart/)
  })

  it('throws when an entry exceeds durationMs', () => {
    expect(() => assertValidBeatmap(beatmap([
      { timeMs: 25_000, lane: 'left' },
    ], 20_000))).toThrow(/durationMs/)
  })

  it('does not throw for a valid beatmap', () => {
    expect(() => assertValidBeatmap(beatmap([
      { timeMs: 0, lane: 'left' },
      { timeMs: 500, lane: 'down' },
    ]))).not.toThrow()
  })
})

describe('sliceBeatmapClip', () => {
  it('re-times entries within the window to start at 0', () => {
    const clip = sliceBeatmapClip(beatmap([
      { timeMs: 1000, lane: 'left' },
      { timeMs: 1500, lane: 'down' },
      { timeMs: 5000, lane: 'right' },
    ]), 1000, 2000)
    expect(clip).toEqual([
      { timeMs: 0, lane: 'left' },
      { timeMs: 500, lane: 'down' },
    ])
  })
})

describe('findNearestEntryInLane', () => {
  const entries = [
    { timeMs: 1000, lane: 'left' as const },
    { timeMs: 1200, lane: 'down' as const },
    { timeMs: 3000, lane: 'left' as const },
  ]

  it('returns the closest entry in the requested lane within the window', () => {
    expect(findNearestEntryInLane(entries, 'left', 1050, 100)).toEqual({ timeMs: 1000, lane: 'left' })
  })

  it('returns null when the closest entry is outside the window', () => {
    expect(findNearestEntryInLane(entries, 'left', 2000, 100)).toBeNull()
  })

  it('returns null when the lane has no entries', () => {
    expect(findNearestEntryInLane(entries, 'right', 1000, 500)).toBeNull()
  })
})
