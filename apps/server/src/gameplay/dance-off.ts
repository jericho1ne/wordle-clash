import {
  type Beatmap,
  type BeatmapEntry,
  danceOffClip,
  DANCE_OFF_CLIP_MS,
  DANCE_OFF_POINTS,
  type DanceHitJudgment,
  type Lane,
  judgeSubmittedHit,
  parseBeatmap,
} from '@wordle-clash/shared'

// Imported from the web app's public assets (not duplicated) — the client
// fetches this same file over HTTP, so both sides judge hits against
// byte-identical data. See docs/stories/08-beatmap-engine.
import trackBeatmapJson from '../../../web/public/audio/canto-de-ossanha.beatmap.json'

export const DANCE_OFF_STORAGE_KEY = 'danceOff'

const TRACK_BEATMAP: Beatmap = parseBeatmap(trackBeatmapJson)

export interface AuthoritativeDanceOff {
  playerIds: string[]
  clip: BeatmapEntry[]
  startedAt: number
  endsAt: number
  scores: Record<string, number>
  consumedIndices: Record<string, number[]>
}

export function createDanceOff(playerIds: string[], now = Date.now()): AuthoritativeDanceOff {
  return {
    playerIds,
    clip: danceOffClip(TRACK_BEATMAP),
    startedAt: now,
    endsAt: now + DANCE_OFF_CLIP_MS,
    scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
    consumedIndices: Object.fromEntries(playerIds.map((id) => [id, []])),
  }
}

export function danceOffBeatmapForClip(danceOff: AuthoritativeDanceOff): Beatmap {
  return { trackPath: TRACK_BEATMAP.trackPath, durationMs: DANCE_OFF_CLIP_MS, entries: danceOff.clip }
}

/**
 * Authoritatively judges a hit and updates the dance-off's score in place.
 * Only entries not yet consumed by this player can be matched, so the same
 * note can't be scored twice.
 */
export function judgeAndScoreHit(
  danceOff: AuthoritativeDanceOff,
  playerId: string,
  lane: Lane,
  timeMs: number,
): DanceHitJudgment {
  const consumed = danceOff.consumedIndices[playerId] ?? []
  const available = danceOff.clip.filter((_, index) => !consumed.includes(index))
  const result = judgeSubmittedHit(available, lane, timeMs)

  if (result.matchedEntry) {
    const index = danceOff.clip.indexOf(result.matchedEntry)
    if (index >= 0) danceOff.consumedIndices[playerId] = [...consumed, index]
  }

  danceOff.scores[playerId] = (danceOff.scores[playerId] ?? 0) + DANCE_OFF_POINTS[result.judgment]
  return result.judgment
}

/** Highest score wins; an exact tie has no winner (caller re-runs a sudden-death clip). */
export function danceOffWinner(danceOff: AuthoritativeDanceOff): string | null {
  const scored = danceOff.playerIds.map((id) => [id, danceOff.scores[id] ?? 0] as const)
  const maxScore = Math.max(...scored.map(([, score]) => score))
  const leaders = scored.filter(([, score]) => score === maxScore)
  return leaders.length === 1 ? (leaders[0]?.[0] ?? null) : null
}
