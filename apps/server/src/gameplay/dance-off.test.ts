import {
  describe,
  expect,
  it,
} from 'vitest'

import { DANCE_OFF_CLIP_MS } from '@wordle-clash/shared'

import {
  createDanceOff,
  danceOffBeatmapForClip,
  danceOffWinner,
  judgeAndScoreHit,
} from './dance-off'

describe('authoritative dance-off', () => {
  it('creates a fixed clip and zeroed scores for every tied player', () => {
    const danceOff = createDanceOff(['a', 'b'], 1_000)
    expect(danceOff.endsAt).toBe(1_000 + DANCE_OFF_CLIP_MS)
    expect(danceOff.scores).toEqual({ a: 0, b: 0 })
    expect(danceOff.clip.length).toBeGreaterThan(0)
    expect(danceOff.clip.every((entry) => entry.timeMs < DANCE_OFF_CLIP_MS)).toBe(true)
  })

  it('exposes the clip as a Beatmap the client protocol can carry', () => {
    const danceOff = createDanceOff(['a'], 0)
    const beatmap = danceOffBeatmapForClip(danceOff)
    expect(beatmap.durationMs).toBe(DANCE_OFF_CLIP_MS)
    expect(beatmap.entries).toEqual(danceOff.clip)
  })

  it('scores a hit and prevents the same note from being consumed twice', () => {
    const danceOff = createDanceOff(['a'], 0)
    const firstEntry = danceOff.clip[0]
    if (!firstEntry) throw new Error('fixture beatmap has no entries')

    const firstJudgment = judgeAndScoreHit(danceOff, 'a', firstEntry.lane, firstEntry.timeMs)
    expect(firstJudgment).toBe('perfect')
    expect(danceOff.consumedIndices.a).toEqual([0])

    // Same instant, same lane — the note is already consumed, so this is a miss, not a double perfect.
    const secondJudgment = judgeAndScoreHit(danceOff, 'a', firstEntry.lane, firstEntry.timeMs)
    expect(secondJudgment).toBe('miss')
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
