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

export type DanceTier = 'marvelous' | 'perfect' | 'great' | 'good' | 'boo'
export type DanceHitJudgment = DanceTier | 'miss'

export interface TimingWindow {
  tier: DanceTier
  /** How far off (in ms) a hit can be and still count as this tier. */
  windowMs: number
  points: number
}

/** Named timing tiers, closest to farthest. A hit outside every window is a miss (0 points). */
export const CORRECT_TIME_WINDOWS: TimingWindow[] = [
  { tier: 'marvelous', windowMs: 16.7, points: 5 },
  { tier: 'perfect', windowMs: 33, points: 4 },
  { tier: 'great', windowMs: 92, points: 3 },
  { tier: 'good', windowMs: 142, points: 2 },
  { tier: 'boo', windowMs: 225, points: 1 },
]

export const DANCE_OFF_POINTS: Record<DanceHitJudgment, number> = {
  ...Object.fromEntries(CORRECT_TIME_WINDOWS.map(({ tier, points }) => [tier, points])),
  miss: 0,
} as Record<DanceHitJudgment, number>

/** The widest timing window — how far the code looks for a note to match a hit against at all. */
export const DANCE_OFF_MAX_WINDOW_MS = CORRECT_TIME_WINDOWS[CORRECT_TIME_WINDOWS.length - 1]!.windowMs

/** Every possible judgment, tiers first then miss. Used to build the protocol's danceOffHit schema. */
export const DANCE_HIT_JUDGMENTS: [DanceHitJudgment, ...DanceHitJudgment[]] = [
  'marvelous',
  'perfect',
  'great',
  'good',
  'boo',
  'miss',
]

/** Judges a hit by its distance (ms) from the beatmap entry it was matched against. */
export function judgeDanceHit(deltaMs: number): DanceHitJudgment {
  const distance = Math.abs(deltaMs)
  for (const window of CORRECT_TIME_WINDOWS) {
    if (distance <= window.windowMs) return window.tier
  }
  return 'miss'
}

export interface DanceHitResult {
  judgment: DanceHitJudgment
  /** The beatmap entry the hit was matched against, or null when nothing was within range (an automatic miss). */
  matchedEntry: BeatmapEntry | null
}

/** Judges a hit against the nearest note in `lane`. Pass in only unused notes, so one note can't be hit twice. */
export function judgeSubmittedHit(entries: BeatmapEntry[], lane: Lane, timeMs: number): DanceHitResult {
  const nearest = findNearestEntryInLane(entries, lane, timeMs, DANCE_OFF_MAX_WINDOW_MS)
  if (!nearest) return { judgment: 'miss', matchedEntry: null }
  return { judgment: judgeDanceHit(nearest.timeMs - timeMs), matchedEntry: nearest }
}

/** The fixed clip both players battle over: the first DANCE_OFF_CLIP_MS of the beatmap. */
export function danceOffClip(beatmap: Beatmap): BeatmapEntry[] {
  return sliceBeatmapClip(beatmap, 0, DANCE_OFF_CLIP_MS)
}
