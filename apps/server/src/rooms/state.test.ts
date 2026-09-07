import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  createInitialRoomState,
  createRoomSnapshot,
  parseStoredRoomState,
} from './state'

describe('room state', () => {
  it('creates the empty authoritative lobby state', () => {
    expect(createInitialRoomState('TEST-0001', 1_000)).toEqual({
      roomCode: 'TEST-0001',
      phase: 'lobby',
      hostId: null,
      gameMode: 'sync',
      syncRoundDurationMinutes: 1,
      players: [],
      createdAt: 1_000,
    })
  })

  it('validates state loaded from durable storage', () => {
    const state = createInitialRoomState('TEST-0001', 1_000)
    expect(parseStoredRoomState(state)).toEqual(state)
    expect(() => parseStoredRoomState({ ...state, phase: 'unknown' })).toThrow()
  })

  it('assigns deterministic seat colors to rooms stored before player colors existed', () => {
    const state = createInitialRoomState('TEST-0001', 1_000)
    state.players = [
      {
        id: 'user-1',
        name: 'Nova',
        avatarId: 0,
        animalId: 0,
        isHost: true,
        ready: false,
        connected: true,
        joinedAt: 1_000,
      },
      {
        id: 'user-2',
        name: 'Cinder',
        avatarId: 0,
        animalId: 1,
        isHost: false,
        ready: false,
        connected: true,
        joinedAt: 1_001,
      },
    ] as typeof state.players

    const restored = parseStoredRoomState(state)
    expect(restored.players.map(({ playerColorId }) => playerColorId)).toEqual([0, 1])
  })

  it('creates an isolated reconnect snapshot', () => {
    const state = createInitialRoomState('TEST-0001', 1_000)
    const snapshot = createRoomSnapshot(state, 'user-1')

    expect(snapshot).toEqual({
      t: 'roomState',
      room: state,
      selfId: 'user-1',
    })
    expect(snapshot.room).not.toBe(state)
  })
})
