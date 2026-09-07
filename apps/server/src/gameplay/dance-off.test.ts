import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createDanceOff,
  danceOffBeatmap,
  danceOffWinner,
  judgeAndScoreHit,
} from './dance-off'

describe('authoritative dance-off', () => {
  it('creates a full-track battle and zeroed scores for every tied player', () => {
    const danceOff = createDanceOff(['a', 'b'], 1_000)
    expect(danceOff.scores).toEqual({ a: 0, b: 0 })
    expect(danceOff.entries.length).toBeGreaterThan(0)
    expect(danceOff.endsAt).toBe(1_000 + danceOffBeatmap(danceOff).durationMs)
  })

  it('exposes the full track as a Beatmap the client protocol can carry', () => {
    const danceOff = createDanceOff(['a'], 0)
    const beatmap = danceOffBeatmap(danceOff)
    expect(beatmap.entries).toEqual(danceOff.entries)
  })

  it('scores a hit and prevents the same note from being consumed twice', () => {
    const danceOff = createDanceOff(['a'], 0)
    const firstEntry = danceOff.entries[0]
    if (!firstEntry) throw new Error('fixture beatmap has no entries')

    const firstJudgment = judgeAndScoreHit(danceOff, 'a', firstEntry.lane, firstEntry.timeMs)
    expect(firstJudgment).toBe('marvelous')
    expect(danceOff.consumedIndices.a).toEqual([0])

    // Same instant, same lane — the note is already consumed, so this is a miss, not a double perfect.
    const secondJudgment = judgeAndScoreHit(danceOff, 'a', firstEntry.lane, firstEntry.timeMs)
    expect(secondJudgment).toBe('miss')
    expect(danceOff.scores.a).toBe(4)
  })

  it('deducts a point for an off-target hit', () => {
    const danceOff = createDanceOff(['a'], 0)

    expect(judgeAndScoreHit(danceOff, 'a', 'left', -1_000)).toBe('miss')
    expect(danceOff.scores.a).toBe(-1)
  })

  it('declares the higher score the winner', () => {
    const danceOff = createDanceOff(['a', 'b'], 0)
    danceOff.scores = { a: 6, b: 3 }
    expect(danceOffWinner(danceOff)).toBe('a')
  })

  it('has no winner on an exact tie', () => {
    const danceOff = createDanceOff(['a', 'b'], 0)
    danceOff.scores = { a: 4, b: 4 }
    expect(danceOffWinner(danceOff)).toBeNull()
  })
})
