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
