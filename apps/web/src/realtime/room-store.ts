import { create } from 'zustand'

import {
  type ClientMessage,
  type ErrorMessage,
  type GameMode,
  type MatchStartingMessage,
  type MatchSnapshot,
  type RoomState,
  type ServerMessage,
  type SyncRoundDurationMinutes,
} from '@wordle-clash/shared'

import { RoomSocket } from './room-socket'

export type RoomConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'terminal'

interface RoomStoreState {
  status: RoomConnectionStatus
  room: RoomState | null
  selfId: string | null
  error: ErrorMessage | Error | null
  matchStarting: MatchStartingMessage | null
  match: MatchSnapshot | null
  pendingActions: ClientMessage[]
  connect: (roomCode: string) => void
  disconnect: () => void
  send: (message: ClientMessage) => void
  setReady: (ready: boolean) => void
  setGameMode: (mode: GameMode) => void
  setSyncRoundDuration: (minutes: SyncRoundDurationMinutes) => void
  startMatch: () => void
  submitGuess: (guess: string) => void
  returnToLobby: () => void
  dismissMatchStarting: () => void
}

type RoomDataState = Pick<RoomStoreState, 'room' | 'selfId' | 'pendingActions'>

let activeSocket: RoomSocket | null = null
let removeSocketListeners: (() => void)[] = []
const HEARTBEAT_INTERVAL_MS = 15_000

function updatePlayer(
  room: RoomState,
  playerId: string,
  patch: Partial<RoomState['players'][number]>,
): RoomState {
  return {
    ...room,
    players: room.players.map((player) => (
      player.id === playerId
        ? { ...player, ...patch }
        : player
    )),
  }
}

function acknowledgePendingActions(
  pendingActions: ClientMessage[],
  message: ServerMessage,
  selfId: string | null,
): ClientMessage[] {
  if (message.t !== 'playerUpdated' || message.playerId !== selfId) return pendingActions
  if (message.patch.ready === undefined) return pendingActions

  const acknowledgedReady = message.patch.ready

  return pendingActions.filter((action) => (
    action.t !== 'setReady' || action.ready !== acknowledgedReady
  ))
}

export function reduceRoomMessage(
  state: RoomDataState,
  message: ServerMessage,
): RoomDataState {
  if (message.t === 'roomState') {
    return {
      room: message.room,
      selfId: message.selfId,
      pendingActions: state.pendingActions.filter((action) => {
        if (action.t !== 'setReady') return true

        const self = message.room.players.find(({ id }) => id === message.selfId)
        return self?.ready !== action.ready
      }),
    }
  }

  if (!state.room) return state

  switch (message.t) {
    case 'playerJoined':
      return state.room.players.some(({ id }) => id === message.player.id)
        ? state
        : {
            ...state,
            room: {
              ...state.room,
              players: [...state.room.players, message.player],
            },
          }

    case 'playerLeft':
      return {
        ...state,
        room: {
          ...state.room,
          hostId: message.hostId,
          players: state.room.players
            .filter(({ id }) => id !== message.playerId)
            .map((player) => ({
              ...player,
              isHost: player.id === message.hostId,
            })),
        },
      }

    case 'playerUpdated':
      return {
        ...state,
        room: updatePlayer(state.room, message.playerId, message.patch),
        pendingActions: acknowledgePendingActions(
          state.pendingActions,
          message,
          state.selfId,
        ),
      }

    case 'gameModeChanged':
      return {
        ...state,
        room: { ...state.room, gameMode: message.mode },
      }

    case 'syncRoundDurationChanged':
      return {
        ...state,
        room: { ...state.room, syncRoundDurationMinutes: message.minutes },
      }

    case 'hostChanged':
      return {
        ...state,
        room: {
          ...state.room,
          hostId: message.hostId,
          players: state.room.players.map((player) => ({
            ...player,
            isHost: player.id === message.hostId,
          })),
        },
      }

    case 'matchStarting':
      return {
        ...state,
        room: { ...state.room, phase: 'starting' },
      }

    case 'matchState':
    case 'guessAccepted':
      return state

    case 'error':
    case 'pong':
      return state
  }
}

function clearActiveSocket(): void {
  for (const removeListener of removeSocketListeners) removeListener()
  removeSocketListeners = []
  activeSocket?.disconnect()
  activeSocket = null
}

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  status: 'idle',
  room: null,
  selfId: null,
  error: null,
  matchStarting: null,
  match: null,
  pendingActions: [],

  connect(roomCode) {
    clearActiveSocket()

    const socket = new RoomSocket(roomCode)
    activeSocket = socket
    set({
      status: 'connecting',
      room: null,
      selfId: null,
      error: null,
      matchStarting: null,
      match: null,
      pendingActions: [],
    })

    const reduce = (message: ServerMessage) => set((state) => ({
      ...reduceRoomMessage(state, message),
      error: message.t === 'error' ? message : state.error,
    }))

    const sendHeartbeat = () => socket.send({ t: 'ping' })
    const heartbeatInterval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    removeSocketListeners = [
      () => window.clearInterval(heartbeatInterval),
      () => document.removeEventListener('visibilitychange', handleVisibilityChange),
      socket.on('open', () => {
        set({ status: 'connected' })
        sendHeartbeat()
        for (const action of get().pendingActions) socket.send(action)
      }),
      socket.on('close', () => {
        if (get().status !== 'idle' && get().status !== 'terminal') {
          set({ status: 'reconnecting' })
        }
      }),
      socket.on('roomState', (message) => {
        reduce(message)
        if (message.room.phase === 'lobby') set({ match: null })
      }),
      socket.on('playerJoined', reduce),
      socket.on('playerLeft', reduce),
      socket.on('playerUpdated', reduce),
      socket.on('gameModeChanged', reduce),
      socket.on('syncRoundDurationChanged', reduce),
      socket.on('hostChanged', reduce),
      socket.on('matchStarting', (message) => {
        reduce(message)
        set({ matchStarting: message })
      }),
      socket.on('matchState', (message) => set({
        match: message.match,
        error: null,
      })),
      socket.on('guessAccepted', () => undefined),
      socket.on('error', reduce),
      socket.on('terminalError', (error) => set({
        status: 'terminal',
        error,
      })),
      socket.on('protocolError', (error) => set({ error })),
    ]

    socket.connect()
  },

  disconnect() {
    clearActiveSocket()
    set({
      status: 'idle',
      room: null,
      selfId: null,
      error: null,
      matchStarting: null,
      match: null,
      pendingActions: [],
    })
  },

  send(message) {
    activeSocket?.send(message)
  },

  setReady(ready) {
    const { room, selfId } = get()
    if (!room || !selfId) return

    const message = { t: 'setReady', ready } satisfies ClientMessage
    set((state) => ({
      room: state.room ? updatePlayer(state.room, selfId, { ready }) : null,
      pendingActions: [
        ...state.pendingActions.filter(({ t }) => t !== 'setReady'),
        message,
      ],
    }))
    activeSocket?.send(message)
  },

  setGameMode(mode) {
    const { room } = get()
    if (!room || room.phase !== 'lobby') return

    set({ room: { ...room, gameMode: mode } })
    activeSocket?.send({ t: 'setGameMode', mode })
  },

  setSyncRoundDuration(minutes) {
    const { room } = get()
    if (!room || room.phase !== 'lobby') return

    set({ room: { ...room, syncRoundDurationMinutes: minutes } })
    activeSocket?.send({ t: 'setSyncRoundDuration', minutes })
  },

  startMatch() {
    activeSocket?.send({ t: 'startMatch' })
  },

  submitGuess(guess) {
    set({ error: null })
    activeSocket?.send({ t: 'submitGuess', guess })
  },

  returnToLobby() {
    activeSocket?.send({ t: 'returnToLobby' })
  },

  dismissMatchStarting() {
    set({ matchStarting: null })
  },
}))
