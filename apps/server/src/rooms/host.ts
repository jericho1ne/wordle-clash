import type {
  Player,
  RoomState,
} from '@wordle-clash/shared'

export function selectNextHostId(players: readonly Player[]): string | null {
  const connectedPlayers = players
    .filter(({ connected }) => connected)
    .toSorted((left, right) => {
      const joinedAtDifference = left.joinedAt - right.joinedAt
      if (joinedAtDifference !== 0) return joinedAtDifference
      if (left.id === right.id) return 0
      return left.id < right.id ? -1 : 1
    })

  return connectedPlayers[0]?.id ?? null
}

export function applyHost(state: RoomState, hostId: string | null): void {
  state.hostId = hostId
  for (const player of state.players) player.isHost = player.id === hostId
}
