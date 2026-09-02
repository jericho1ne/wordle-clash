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
