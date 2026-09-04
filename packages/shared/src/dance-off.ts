import type {
  Beatmap,
  BeatmapEntry,
  Lane,
} from './beatmap.js'
import {
  findNearestEntryInLane,
  sliceBeatmapClip,
} from './beatmap.js'

/** Scoring rules for the Tiebreaker Battle. Shared by the playground, the real game, and the server, so scoring is the same everywhere. */

/** Fixed clip length every dance-off battle runs — same slice of the beatmap for every player. */
export const DANCE_OFF_CLIP_MS = 20_000

/** Absolute ms distance from a beatmap entry's timeMs within which a hit counts as "perfect". */
export const DANCE_OFF_PERFECT_WINDOW_MS = 60

/** Absolute ms distance within which a hit that missed "perfect" still counts as "good". Beyond this, or unmatched, it's a miss. */
export const DANCE_OFF_GOOD_WINDOW_MS = 140

export type DanceHitJudgment = 'perfect' | 'good' | 'miss'

export const DANCE_OFF_POINTS: Record<DanceHitJudgment, number> = {
  perfect: 3,
  good: 1,
  miss: 0,
}

/** Judges a hit by its distance (ms) from the beatmap entry it was matched against. */
export function judgeDanceHit(deltaMs: number): DanceHitJudgment {
  const distance = Math.abs(deltaMs)
  if (distance <= DANCE_OFF_PERFECT_WINDOW_MS) return 'perfect'
  if (distance <= DANCE_OFF_GOOD_WINDOW_MS) return 'good'
  return 'miss'
}

export interface DanceHitResult {
  judgment: DanceHitJudgment
  /** The beatmap entry the hit was matched against, or null when nothing was within range (an automatic miss). */
  matchedEntry: BeatmapEntry | null
}

/** Judges a hit against the nearest note in `lane`. Pass in only unused notes, so one note can't be hit twice. */
export function judgeSubmittedHit(entries: BeatmapEntry[], lane: Lane, timeMs: number): DanceHitResult {
  const nearest = findNearestEntryInLane(entries, lane, timeMs, DANCE_OFF_GOOD_WINDOW_MS)
  if (!nearest) return { judgment: 'miss', matchedEntry: null }
  return { judgment: judgeDanceHit(nearest.timeMs - timeMs), matchedEntry: nearest }
}

/** The fixed clip both players battle over: the first DANCE_OFF_CLIP_MS of the beatmap. */
export function danceOffClip(beatmap: Beatmap): BeatmapEntry[] {
  return sliceBeatmapClip(beatmap, 0, DANCE_OFF_CLIP_MS)
}
