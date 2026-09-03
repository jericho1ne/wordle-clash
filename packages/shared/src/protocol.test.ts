import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  assertNever,
  parseClientMessage,
  parseServerMessage,
  serializeClientMessage,
  serializeServerMessage,
  type ClientMessage,
  type ServerMessage,
} from './protocol.js'

const CLIENT_MESSAGES: ClientMessage[] = [
  { t: 'setReady', ready: true },
  { t: 'setGameMode', mode: 'realtime' },
  { t: 'setSyncRoundDuration', minutes: 3 },
  { t: 'updateProfile', name: 'Nova', avatarId: 2, animalId: 7 },
  { t: 'startMatch' },
  { t: 'returnToLobby' },
  { t: 'submitGuess', guess: 'CLASH' },
  { t: 'leave' },
  { t: 'ping' },
  { t: 'submitDanceHit', lane: 'up', clientTimeMs: 1234 },
]

const ROOM_STATE_MESSAGE: ServerMessage = {
  t: 'roomState',
  selfId: 'user-1',
  room: {
    roomCode: 'TEST-0001',
    phase: 'lobby',
    hostId: 'user-1',
    gameMode: 'sync',
    syncRoundDurationMinutes: 1,
    players: [
      {
        id: 'user-1',
        name: 'Nova',
        avatarId: 2,
        animalId: 7,
        isHost: true,
        ready: false,
        connected: true,
        joinedAt: 1_000,
      },
    ],
    createdAt: 1_000,
  },
}

describe('client protocol', () => {
  it.each(CLIENT_MESSAGES)('round-trips $t messages', (message) => {
    expect(parseClientMessage(serializeClientMessage(message))).toEqual(message)
  })

  it('accepts UTF-8 binary frames', () => {
    const frame = new TextEncoder().encode('{"t":"ping"}')
    expect(parseClientMessage(frame)).toEqual({ t: 'ping' })
  })

  it('rejects malformed JSON', () => {
    expect(() => parseClientMessage('{')).toThrow()
  })

  it('rejects unknown message types and properties', () => {
    expect(() => parseClientMessage('{"t":"guess"}')).toThrow()
    expect(() => parseClientMessage('{"t":"ping","secret":"WORD"}')).toThrow()
  })

  it('rejects invalid profile fields', () => {
    expect(() => parseClientMessage({
      t: 'updateProfile',
      name: 'This name is much too long',
      avatarId: 99,
    })).toThrow()
  })
})

describe('server protocol', () => {
  it('round-trips a synchronous round-duration update', () => {
    const message: ServerMessage = {
      t: 'syncRoundDurationChanged',
      minutes: 5,
      byPlayerId: 'user-1',
    }

    expect(parseServerMessage(serializeServerMessage(message))).toEqual(message)
  })

  it('round-trips a full room snapshot', () => {
    expect(parseServerMessage(serializeServerMessage(ROOM_STATE_MESSAGE)))
      .toEqual(ROOM_STATE_MESSAGE)
  })

  it('rejects invalid nested room state', () => {
    expect(() => parseServerMessage({
      ...ROOM_STATE_MESSAGE,
      room: {
        ...ROOM_STATE_MESSAGE.room,
        roomCode: 'bad-code',
      },
    })).toThrow()
  })

  it('round-trips a sanitized gameplay snapshot', () => {
    const message: ServerMessage = {
      t: 'matchState',
      match: {
        mode: 'realtime',
        phase: 'active',
        round: 1,
        maxGuesses: 10,
        roundEndsAt: null,
        players: [{
          playerId: 'user-1',
          guesses: [{
            word: 'CLOUD',
            tiles: ['correct', 'present', 'absent', 'absent', 'absent'],
          }],
          submitted: false,
          eliminated: false,
        }],
        winnerId: null,
        tiebreakPlayerIds: [],
        answer: null,
      },
    }

    expect(parseServerMessage(serializeServerMessage(message))).toEqual(message)
  })

  it('round-trips a dance-off start, score, and end', () => {
    const started: ServerMessage = {
      t: 'danceOffStarted',
      beatmap: {
        trackPath: 'audio/canto-de-ossanha.mp3',
        durationMs: 20_000,
        entries: [{ timeMs: 500, lane: 'up' }],
      },
      startsAt: 1_000,
      playerIds: ['user-1', 'user-2'],
    }
    const score: ServerMessage = {
      t: 'danceOffScore',
      scores: { 'user-1': 6, 'user-2': 3 },
    }
    const ended: ServerMessage = { t: 'danceOffEnded', winnerId: 'user-1' }

    expect(parseServerMessage(serializeServerMessage(started))).toEqual(started)
    expect(parseServerMessage(serializeServerMessage(score))).toEqual(score)
    expect(parseServerMessage(serializeServerMessage(ended))).toEqual(ended)
  })
})

describe('assertNever', () => {
  it('throws with the unhandled value', () => {
    const callAssertNever = assertNever as (value: unknown) => never
    expect(() => callAssertNever({ t: 'futureMessage' }))
      .toThrow('Unhandled protocol value')
  })
})
