/** Nonpositive scores have no fill and cannot earn a first-place star. */
export function scoreStandings(scores: Record<string, number>, playerIds: readonly string[]) {
  const highest = Math.max(0, ...playerIds.map((id) => scores[id] ?? 0))
  const leaders = playerIds.filter((id) => (scores[id] ?? 0) === highest)
  return { highest, leaderId: highest > 0 && leaders.length === 1 ? leaders[0] : null }
}
