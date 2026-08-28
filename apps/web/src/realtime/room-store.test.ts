import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  Player,
  RoomState,
} from '@wordle-clash/shared'

import { reduceRoomMessage } from './room-store'

const SELF: Player = {
  id: 'self',
  name: 'Ember',
  avatarId: 0,
  animalId: 0,
  isHost: true,
  ready: false,
  connected: true,
  joinedAt: 1,
}

const ROOM: RoomState = {
  roomCode: 'TEST-0001',
  phase: 'lobby',
  hostId: SELF.id,
  gameMode: 'sync',
  players: [SELF],
  createdAt: 1,
}

describe('reduceRoomMessage', () => {
  it('replaces local state from an authoritative snapshot', () => {
    const result = reduceRoomMessage(
      {
        room: null,
        selfId: null,
        pendingActions: [{ t: 'setReady', ready: false }],
      },
      {
        t: 'roomState',
        room: ROOM,
        selfId: SELF.id,
      },
    )

    expect(result.room).toEqual(ROOM)
    expect(result.selfId).toBe(SELF.id)
    expect(result.pendingActions).toEqual([])
  })

  it('adds a joined player and applies their updates', () => {
    const guest: Player = {
      ...SELF,
      id: 'guest',
      name: 'Cinder',
      isHost: false,
      joinedAt: 2,
    }
    const joined = reduceRoomMessage(
      { room: ROOM, selfId: SELF.id, pendingActions: [] },
      { t: 'playerJoined', player: guest },
    )
    const updated = reduceRoomMessage(
      joined,
      {
        t: 'playerUpdated',
        playerId: guest.id,
        patch: { ready: true },
      },
    )

    expect(updated.room?.players).toHaveLength(2)
    expect(updated.room?.players[1]?.ready).toBe(true)
  })

  it('acknowledges a matching optimistic ready action', () => {
    const result = reduceRoomMessage(
      {
        room: {
          ...ROOM,
          players: [{ ...SELF, ready: true }],
        },
        selfId: SELF.id,
        pendingActions: [{ t: 'setReady', ready: true }],
      },
      {
        t: 'playerUpdated',
        playerId: SELF.id,
        patch: { ready: true },
      },
    )

    expect(result.pendingActions).toEqual([])
  })

  it('reassigns host flags when the host changes', () => {
    const guest: Player = {
      ...SELF,
      id: 'guest',
      name: 'Cinder',
      isHost: false,
      joinedAt: 2,
    }
    const result = reduceRoomMessage(
      {
        room: { ...ROOM, players: [SELF, guest] },
        selfId: SELF.id,
        pendingActions: [],
      },
      { t: 'hostChanged', hostId: guest.id },
    )

    expect(result.room?.hostId).toBe(guest.id)
    expect(result.room?.players.map(({ isHost }) => isHost)).toEqual([false, true])
  })

  it('locks the room phase when a match starts', () => {
    const result = reduceRoomMessage(
      { room: ROOM, selfId: SELF.id, pendingActions: [] },
      {
        t: 'matchStarting',
        mode: 'sync',
        tries: 5,
        playerCount: 2,
        startsAt: 2_000,
      },
    )

    expect(result.room?.phase).toBe('starting')
  })
})
