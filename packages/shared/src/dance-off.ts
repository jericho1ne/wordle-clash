import type {
  Beatmap,
  BeatmapEntry,
  Lane,
} from './beatmap.js'
import {
  findNearestEntryInLane,
  sliceBeatmapClip,
} from './beatmap.js'

/**
 * Tiebreaker Battle scoring contract (Epic 09). Shared by the playground,
 * the real client gameplay, and the Room DO's authoritative judging so a
 * hit is scored identically everywhere.
 */

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

/**
 * The single judging call both the Room DO (authoritative) and any
 * client-side optimistic feedback should use: finds the nearest unconsumed
 * entry in `lane` within the good-hit window and judges it, or reports a
 * miss when nothing is close enough. Callers are responsible for excluding
 * already-consumed entries from `entries` so one note can't be hit twice.
 */
export function judgeSubmittedHit(entries: BeatmapEntry[], lane: Lane, timeMs: number): DanceHitResult {
  const nearest = findNearestEntryInLane(entries, lane, timeMs, DANCE_OFF_GOOD_WINDOW_MS)
  if (!nearest) return { judgment: 'miss', matchedEntry: null }
  return { judgment: judgeDanceHit(nearest.timeMs - timeMs), matchedEntry: nearest }
}

/** The fixed clip both players battle over: the first DANCE_OFF_CLIP_MS of the beatmap. */
export function danceOffClip(beatmap: Beatmap): BeatmapEntry[] {
  return sliceBeatmapClip(beatmap, 0, DANCE_OFF_CLIP_MS)
}
