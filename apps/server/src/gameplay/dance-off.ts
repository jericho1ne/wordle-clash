import {
  type Beatmap,
  type BeatmapEntry,
  DANCE_OFF_POINTS,
  type DanceHitJudgment,
  type Lane,
  judgeSubmittedHit,
  parseCompactBeatmap,
} from '@wordle-clash/shared'

// Same file the client fetches over HTTP, so both sides see the same beat map.
import trackBeatmapJson from '../../../web/public/audio/canto-de-ossanha.beatmap.json'

export const DANCE_OFF_STORAGE_KEY = 'danceOff'

const TRACK_BEATMAP: Beatmap = parseCompactBeatmap(trackBeatmapJson)

export interface AuthoritativeDanceOff {
  playerIds: string[]
  entries: BeatmapEntry[]
  startedAt: number
  endsAt: number
  scores: Record<string, number>
  consumedIndices: Record<string, number[]>
}

export function createDanceOff(playerIds: string[], now = Date.now()): AuthoritativeDanceOff {
  return {
    playerIds,
    entries: TRACK_BEATMAP.entries,
    startedAt: now,
    endsAt: now + TRACK_BEATMAP.durationMs,
    scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
    consumedIndices: Object.fromEntries(playerIds.map((id) => [id, []])),
  }
}

export function danceOffBeatmap(danceOff: AuthoritativeDanceOff): Beatmap {
  return { trackPath: TRACK_BEATMAP.trackPath, durationMs: TRACK_BEATMAP.durationMs, entries: danceOff.entries }
}

/** Judges a hit and adds points to the score. A note can't be scored twice. */
export function judgeAndScoreHit(
  danceOff: AuthoritativeDanceOff,
  playerId: string,
  lane: Lane,
  timeMs: number,
): DanceHitJudgment {
  const consumed = danceOff.consumedIndices[playerId] ?? []
  const available = danceOff.entries.filter((_, index) => !consumed.includes(index))
  const result = judgeSubmittedHit(available, lane, timeMs)

  if (result.matchedEntry) {
    const index = danceOff.entries.indexOf(result.matchedEntry)
    if (index >= 0) danceOff.consumedIndices[playerId] = [...consumed, index]
  }

  danceOff.scores[playerId] = (danceOff.scores[playerId] ?? 0) + DANCE_OFF_POINTS[result.judgment]
  return result.judgment
}

/** Highest score wins; an exact tie has no winner (caller re-runs the track). */
export function danceOffWinner(danceOff: AuthoritativeDanceOff): string | null {
  const scored = danceOff.playerIds.map((id) => [id, danceOff.scores[id] ?? 0] as const)
  const maxScore = Math.max(...scored.map(([, score]) => score))
  const leaders = scored.filter(([, score]) => score === maxScore)
  return leaders.length === 1 ? (leaders[0]?.[0] ?? null) : null
}
