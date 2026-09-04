import { z } from 'zod'

/** Minimum gap in milliseconds between any two beatmap entries, regardless of lane. */
export const BEATMAP_MIN_GAP_MS = 120

// Three lanes: kick, snare, and hi-hat. Matches the A/S/D and Left/Down/Right key schemes.
export const LANES = [
  'left',
  'down',
  'right',
] as const

export const laneSchema = z.enum(LANES)
export type Lane = z.infer<typeof laneSchema>

export const beatmapEntrySchema = z.object({
  timeMs: z.number().int().nonnegative(),
  lane: laneSchema,
}).strict()

export type BeatmapEntry = z.infer<typeof beatmapEntrySchema>

export const beatmapSchema = z.object({
  trackPath: z.string().min(1),
  durationMs: z.number().int().positive(),
  entries: z.array(beatmapEntrySchema),
}).strict()

export type Beatmap = z.infer<typeof beatmapSchema>

export function parseBeatmap(value: unknown): Beatmap {
  return beatmapSchema.parse(value)
}

/** True when entries are sorted ascending by timeMs with no duplicates. */
export function isSortedByTime(entries: BeatmapEntry[]): boolean {
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1]
    const current = entries[index]
    if (!previous || !current) continue
    if (current.timeMs <= previous.timeMs) return false
  }
  return true
}

/** True when no two entries are closer together than `BEATMAP_MIN_GAP_MS`. Entries must already be sorted by time. */
export function hasPlayableGaps(entries: BeatmapEntry[], minGapMs = BEATMAP_MIN_GAP_MS): boolean {
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1]
    const current = entries[index]
    if (!previous || !current) continue
    if (current.timeMs - previous.timeMs < minGapMs) return false
  }
  return true
}

/** True when every lane in `LANES` is used at least once. Sanity check, not a hard requirement. */
export function usesAllLanes(entries: BeatmapEntry[]): boolean {
  const used = new Set(entries.map((entry) => entry.lane))
  return LANES.every((lane) => used.has(lane))
}

/** Validates a fully-formed Beatmap against every structural invariant. Throws on the first violation found. */
export function assertValidBeatmap(beatmap: Beatmap): void {
  if (!isSortedByTime(beatmap.entries)) {
    throw new Error('Beatmap entries must be sorted ascending by timeMs with no duplicate timestamps')
  }
  if (!hasPlayableGaps(beatmap.entries)) {
    throw new Error(`Beatmap entries must be at least ${BEATMAP_MIN_GAP_MS}ms apart`)
  }
  for (const entry of beatmap.entries) {
    if (entry.timeMs > beatmap.durationMs) {
      throw new Error(`Beatmap entry at ${entry.timeMs}ms exceeds durationMs (${beatmap.durationMs})`)
    }
  }
}

/** Returns the entries within [startMs, startMs + clipMs), re-timed so the clip starts at 0. */
export function sliceBeatmapClip(beatmap: Beatmap, startMs: number, clipMs: number): BeatmapEntry[] {
  return beatmap.entries
    .filter((entry) => entry.timeMs >= startMs && entry.timeMs < startMs + clipMs)
    .map((entry) => ({ timeMs: entry.timeMs - startMs, lane: entry.lane }))
}

/** Finds the closest entry to `timeMs` in `lane`, or null if the closest one is farther away than `windowMs`. */
export function findNearestEntryInLane(
  entries: BeatmapEntry[],
  lane: Lane,
  timeMs: number,
  windowMs: number,
): BeatmapEntry | null {
  let best: BeatmapEntry | null = null
  let bestDelta = Infinity
  for (const entry of entries) {
    if (entry.lane !== lane) continue
    const delta = Math.abs(entry.timeMs - timeMs)
    if (delta < bestDelta) {
      best = entry
      bestDelta = delta
    }
  }
  if (!best || bestDelta > windowMs) return null
  return best
}
