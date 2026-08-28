import {
  describe,
  expect,
  it,
} from 'vitest'

import type { Player } from '@wordle-clash/shared'

import {
  applyHost,
  selectNextHostId,
} from './host'
import { createInitialRoomState } from './state'

function player(id: string, joinedAt: number, connected = true): Player {
  return {
    id,
    name: id,
    avatarId: 0,
    animalId: 0,
    isHost: false,
    ready: false,
    connected,
    joinedAt,
  }
}

describe('host assignment', () => {
  it('selects the earliest connected player', () => {
    expect(selectNextHostId([
      player('later', 2_000),
      player('disconnected', 500, false),
      player('earlier', 1_000),
    ])).toBe('earlier')
  })

  it('uses the stable user id as the timestamp tie-break', () => {
    expect(selectNextHostId([
      player('user-b', 1_000),
      player('user-a', 1_000),
    ])).toBe('user-a')
  })

  it('updates the room id and every player flag together', () => {
    const state = createInitialRoomState('TEST-0001', 1_000)
    state.players = [player('user-a', 1_000), player('user-b', 2_000)]

    applyHost(state, 'user-b')

    expect(state.hostId).toBe('user-b')
    expect(state.players.map(({ id, isHost }) => ({ id, isHost }))).toEqual([
      { id: 'user-a', isHost: false },
      { id: 'user-b', isHost: true },
    ])
  })
})
