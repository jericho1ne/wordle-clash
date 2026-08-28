import {
  Server,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from 'partyserver'

import {
  assertNever,
  canStartMatch,
  GAME_MODES,
  MAX_PLAYERS,
  parseClientMessage,
  serializeServerMessage,
  type ClientMessage,
  type Player,
  type RoomErrorCode,
  type RoomState,
  type ServerMessage,
} from '@wordle-clash/shared'

import {
  getConnectionState,
  parseConnectionIdentity,
  userConnectionTag,
  type ConnectionIdentity,
  type RoomConnectionState,
} from './connection'
import {
  applyHost,
  selectNextHostId,
} from './host'
import { MutationQueue } from './mutation-queue'
import {
  createInitialRoomState,
  createRoomSnapshot,
  parseStoredRoomState,
  ROOM_STATE_STORAGE_KEY,
} from './state'

const LIFECYCLE_STORAGE_KEY = 'lifecycle'
const DISCONNECT_GRACE_MS = 30_000
const RESERVATION_TTL_MS = 2 * 60_000

interface RoomLifecycle {
  disconnectDeadlines: Record<string, number>
  reservationExpiresAt: number | null
}

function emptyLifecycle(): RoomLifecycle {
  return {
    disconnectDeadlines: {},
    reservationExpiresAt: null,
  }
}

function parseLifecycle(value: unknown): RoomLifecycle {
  if (!value || typeof value !== 'object') return emptyLifecycle()

  const deadlines = (value as { disconnectDeadlines?: unknown }).disconnectDeadlines
  const reservationExpiresAt = (value as { reservationExpiresAt?: unknown })
    .reservationExpiresAt
  if (!deadlines || typeof deadlines !== 'object') return emptyLifecycle()

  return {
    disconnectDeadlines: Object.fromEntries(
      Object.entries(deadlines)
        .filter((entry): entry is [string, number] => (
          typeof entry[1] === 'number' && Number.isFinite(entry[1])
        )),
    ),
    reservationExpiresAt: typeof reservationExpiresAt === 'number' &&
      Number.isFinite(reservationExpiresAt)
      ? reservationExpiresAt
      : null,
  }
}

export class Room extends Server<Env> {
  static override options = { hibernate: true }

  /** Authoritative room state. Mirror of the durable `state` value. */
  state: RoomState | null = null
  lifecycle: RoomLifecycle = emptyLifecycle()
  #mutations = new MutationQueue()

  override async onStart(): Promise<void> {
    const [storedState, storedLifecycle] = await Promise.all([
      this.ctx.storage.get<unknown>(ROOM_STATE_STORAGE_KEY),
      this.ctx.storage.get<unknown>(LIFECYCLE_STORAGE_KEY),
    ])

    this.state = storedState === undefined
      ? null
      : parseStoredRoomState(storedState)
    this.lifecycle = parseLifecycle(storedLifecycle)
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(
      '{"t":"ping"}',
      '{"t":"pong"}',
    ))
  }

  override getConnectionTags(_connection: Connection, ctx: ConnectionContext): string[] {
    const identity = parseConnectionIdentity(ctx.request)
    return [userConnectionTag(identity.userId)]
  }

  override async onConnect(connection: Connection, ctx: ConnectionContext): Promise<void> {
    await this.#mutations.run(() => this.#handleConnect(connection, ctx))
  }

  override async onMessage(connection: Connection, frame: WSMessage): Promise<void> {
    await this.#mutations.run(() => this.#handleMessage(connection, frame))
  }

  override async onClose(connection: Connection): Promise<void> {
    await this.#mutations.run(() => this.#handleDisconnect(connection))
  }

  override async onError(connection: Connection, _error: unknown): Promise<void> {
    await this.#mutations.run(() => this.#handleDisconnect(connection))
  }

  override async onAlarm(): Promise<void> {
    await this.#mutations.run(() => this.#handleAlarm())
  }

  /** Atomically claim this named DO as a room. Called through Durable Object RPC. */
  reserve(userId: string, now = Date.now()): Promise<boolean> {
    return this.#mutations.run(() => this.#reserve(userId, now))
  }

  async #handleConnect(connection: Connection, ctx: ConnectionContext): Promise<void> {
    const identity = parseConnectionIdentity(ctx.request)
    const state = this.state

    if (!state || this.#reservationExpired()) {
      await this.#cleanupEmptyRoom()
      this.#rejectConnection(connection, 'ROOM_NOT_FOUND', 'The room does not exist')
      return
    }

    const existingPlayer = state.players.find(({ id }) => id === identity.userId)

    if (!existingPlayer && state.phase !== 'lobby') {
      this.#rejectConnection(connection, 'MATCH_STARTED', 'The match has already started')
      return
    }

    if (!existingPlayer && state.players.length >= MAX_PLAYERS) {
      this.#rejectConnection(connection, 'ROOM_FULL', 'The room is full')
      return
    }

    connection.setState({
      userId: identity.userId,
      isAnonymous: identity.isAnonymous,
    } satisfies RoomConnectionState)
    delete this.lifecycle.disconnectDeadlines[identity.userId]
    this.lifecycle.reservationExpiresAt = null

    if (existingPlayer) {
      const patch = this.#reconnectPlayer(existingPlayer, identity)
      const hostChanged = this.#assignHostIfVacant()
      await this.#save()
      this.#sendSnapshot(connection, identity.userId)

      if (Object.keys(patch).length > 0) {
        this.#broadcast({
          t: 'playerUpdated',
          playerId: identity.userId,
          patch,
        }, [connection.id])
      }
      if (hostChanged) this.#broadcastHostChanged([connection.id])
    }
    else {
      const player = this.#addPlayer(identity)
      const hostChanged = this.#assignHostIfVacant()
      await this.#save()
      this.#sendSnapshot(connection, identity.userId)
      this.#broadcast({ t: 'playerJoined', player }, [connection.id])
      if (hostChanged) this.#broadcastHostChanged([connection.id])
    }

    await this.#scheduleNextAlarm()
  }

  async #handleMessage(connection: Connection, frame: WSMessage): Promise<void> {
    let message: ClientMessage
    try {
      message = parseClientMessage(frame)
    }
    catch {
      this.#sendError(connection, 'BAD_MESSAGE', 'The message is invalid')
      return
    }

    const connectionState = getConnectionState(connection)
    if (!connectionState) {
      this.#rejectConnection(connection, 'BAD_MESSAGE', 'Connection identity is unavailable')
      return
    }

    await this.#dispatch(connection, connectionState.userId, message)
  }

  async #handleAlarm(): Promise<void> {
    const now = Date.now()
    const removedPlayerIds: string[] = []
    let hostChanged = false

    if (
      this.lifecycle.reservationExpiresAt !== null &&
      this.lifecycle.reservationExpiresAt <= now &&
      this.state?.players.length === 0
    ) {
      await this.#cleanupEmptyRoom()
      await this.#scheduleNextAlarm()
      return
    }

    for (const [userId, deadline] of Object.entries(this.lifecycle.disconnectDeadlines)) {
      if (deadline > now) continue

      if ([...this.getConnections(userConnectionTag(userId))].length > 0) {
        delete this.lifecycle.disconnectDeadlines[userId]
        continue
      }

      const result = this.#removePlayerFromState(userId)
      if (result.removed) removedPlayerIds.push(userId)
      hostChanged ||= result.hostChanged
      delete this.lifecycle.disconnectDeadlines[userId]
    }

    await this.#save()
    for (const playerId of removedPlayerIds) {
      this.#broadcast({
        t: 'playerLeft',
        playerId,
        hostId: this.state?.hostId ?? null,
      })
    }
    if (hostChanged) this.#broadcastHostChanged()
    await this.#cleanupEmptyRoom()
    await this.#scheduleNextAlarm()
  }

  async #dispatch(connection: Connection, userId: string, message: ClientMessage): Promise<void> {
    switch (message.t) {
      case 'ping':
        this.#send(connection, { t: 'pong' })
        return

      case 'leave':
        await this.#leave(userId)
        return

      case 'setReady':
        await this.#setReady(connection, userId, message.ready)
        return

      case 'setGameMode':
        await this.#setGameMode(connection, userId, message.mode)
        return

      case 'updateProfile':
        await this.#updateProfile(userId, message)
        return

      case 'startMatch':
        await this.#startMatch(connection, userId)
        return

      default:
        assertNever(message)
    }
  }

  async #reserve(userId: string, now: number): Promise<boolean> {
    if (this.state) return false

    this.state = createInitialRoomState(this.name, now, userId)
    this.lifecycle = {
      disconnectDeadlines: {},
      reservationExpiresAt: now + RESERVATION_TTL_MS,
    }
    await this.#save()
    await this.#scheduleNextAlarm()
    return true
  }

  async #setReady(connection: Connection, userId: string, ready: boolean): Promise<void> {
    const player = this.state?.players.find(({ id }) => id === userId)
    if (!player || this.state?.phase !== 'lobby') {
      this.#sendError(connection, 'MATCH_STARTED', 'Ready state is locked')
      return
    }

    player.ready = ready
    await this.#save()
    this.#broadcast({
      t: 'playerUpdated',
      playerId: userId,
      patch: { ready },
    })
  }

  async #setGameMode(
    connection: Connection,
    userId: string,
    mode: RoomState['gameMode'],
  ): Promise<void> {
    if (!this.state || this.state.hostId !== userId) {
      this.#sendError(connection, 'NOT_HOST', 'Only the host can change the game mode')
      return
    }

    if (this.state.phase !== 'lobby') {
      this.#sendError(connection, 'MATCH_STARTED', 'The game mode is locked')
      return
    }

    this.state.gameMode = mode
    await this.#save()
    this.#broadcast({
      t: 'gameModeChanged',
      mode,
      byPlayerId: userId,
    })
  }

  async #updateProfile(
    userId: string,
    message: Extract<ClientMessage, { t: 'updateProfile' }>,
  ): Promise<void> {
    const player = this.state?.players.find(({ id }) => id === userId)
    if (!player) return

    const patch: Partial<Pick<Player, 'name' | 'avatarId' | 'animalId'>> = {}
    if (message.name !== undefined && message.name !== player.name) {
      player.name = message.name
      patch.name = message.name
    }
    if (message.avatarId !== undefined && message.avatarId !== player.avatarId) {
      player.avatarId = message.avatarId
      patch.avatarId = message.avatarId
    }
    if (message.animalId !== undefined && message.animalId !== player.animalId) {
      player.animalId = message.animalId
      patch.animalId = message.animalId
    }
    if (Object.keys(patch).length === 0) return

    await this.#save()
    this.#broadcast({
      t: 'playerUpdated',
      playerId: userId,
      patch,
    })
  }

  async #startMatch(connection: Connection, userId: string): Promise<void> {
    if (!this.state || this.state.hostId !== userId) {
      this.#sendError(connection, 'NOT_HOST', 'Only the host can start the match')
      return
    }

    if (!canStartMatch(this.state)) {
      this.#sendError(connection, 'NOT_READY', 'Every player must be ready')
      return
    }

    const startsAt = Date.now() + 1_000
    this.state.phase = 'starting'
    await this.#save()
    this.#broadcast({
      t: 'matchStarting',
      mode: this.state.gameMode,
      tries: GAME_MODES[this.state.gameMode].tries,
      playerCount: this.state.players.length,
      startsAt,
    })
  }

  async #leave(userId: string): Promise<void> {
    const result = this.#removePlayerFromState(userId)
    if (!result.removed) return

    delete this.lifecycle.disconnectDeadlines[userId]
    await this.#save()
    this.#broadcast({
      t: 'playerLeft',
      playerId: userId,
      hostId: this.state?.hostId ?? null,
    })
    if (result.hostChanged) this.#broadcastHostChanged()

    for (const connection of this.getConnections(userConnectionTag(userId))) {
      connection.close(1000, 'Player left')
    }
    await this.#cleanupEmptyRoom()
    await this.#scheduleNextAlarm()
  }

  async #handleDisconnect(connection: Connection): Promise<void> {
    const connectionState = getConnectionState(connection)
    if (!connectionState || !this.state) return

    const userId = connectionState.userId
    if ([...this.getConnections(userConnectionTag(userId))]
      .some(({ id }) => id !== connection.id)) return

    const player = this.state.players.find(({ id }) => id === userId)
    if (!player || !player.connected) return

    player.connected = false
    this.lifecycle.disconnectDeadlines[userId] = Date.now() + DISCONNECT_GRACE_MS
    await this.#save()
    this.#broadcast({
      t: 'playerUpdated',
      playerId: userId,
      patch: { connected: false },
    })
    await this.#scheduleNextAlarm()
  }

  #addPlayer(identity: ConnectionIdentity): Player {
    if (!this.state) throw new Error('Cannot add a player to an unreserved room')

    const state = this.state
    const isHost = state.hostId === null || state.hostId === identity.userId
    const player: Player = {
      id: identity.userId,
      name: identity.name,
      avatarId: identity.avatarId,
      animalId: identity.animalId,
      isHost,
      ready: false,
      connected: true,
      joinedAt: Date.now(),
    }

    state.players.push(player)
    if (isHost) applyHost(state, player.id)
    return player
  }

  #reconnectPlayer(
    player: Player,
    identity: ConnectionIdentity,
  ): Partial<Pick<Player, 'name' | 'avatarId' | 'animalId' | 'connected'>> {
    const patch: Partial<Pick<Player, 'name' | 'avatarId' | 'animalId' | 'connected'>> = {}

    if (player.name !== identity.name) {
      player.name = identity.name
      patch.name = identity.name
    }
    if (player.avatarId !== identity.avatarId) {
      player.avatarId = identity.avatarId
      patch.avatarId = identity.avatarId
    }
    if (player.animalId !== identity.animalId) {
      player.animalId = identity.animalId
      patch.animalId = identity.animalId
    }
    if (!player.connected) {
      player.connected = true
      patch.connected = true
    }

    return patch
  }

  #removePlayerFromState(userId: string): { removed: boolean, hostChanged: boolean } {
    if (!this.state) return { removed: false, hostChanged: false }

    const playerIndex = this.state.players.findIndex(({ id }) => id === userId)
    if (playerIndex === -1) return { removed: false, hostChanged: false }

    const [removedPlayer] = this.state.players.splice(playerIndex, 1)
    if (!removedPlayer?.isHost) return { removed: true, hostChanged: false }

    applyHost(this.state, selectNextHostId(this.state.players))
    return { removed: true, hostChanged: true }
  }

  #assignHostIfVacant(): boolean {
    if (!this.state || this.state.hostId !== null) return false

    const hostId = selectNextHostId(this.state.players)
    if (!hostId) return false

    applyHost(this.state, hostId)
    return true
  }

  #reservationExpired(now = Date.now()): boolean {
    return this.lifecycle.reservationExpiresAt !== null &&
      this.lifecycle.reservationExpiresAt <= now &&
      (this.state?.players.length ?? 0) === 0
  }

  async #save(): Promise<void> {
    const writes: Promise<unknown>[] = [
      this.ctx.storage.put(LIFECYCLE_STORAGE_KEY, this.lifecycle),
    ]

    if (this.state) {
      writes.push(this.ctx.storage.put(
        ROOM_STATE_STORAGE_KEY,
        parseStoredRoomState(this.state),
      ))
    }

    await Promise.all(writes)
  }

  async #cleanupEmptyRoom(): Promise<void> {
    if (this.state?.players.length) return

    this.state = null
    this.lifecycle = emptyLifecycle()
    await Promise.all([
      this.ctx.storage.delete(ROOM_STATE_STORAGE_KEY),
      this.ctx.storage.delete(LIFECYCLE_STORAGE_KEY),
    ])
  }

  async #scheduleNextAlarm(): Promise<void> {
    const deadlines = Object.values(this.lifecycle.disconnectDeadlines)
    if (this.lifecycle.reservationExpiresAt !== null) {
      deadlines.push(this.lifecycle.reservationExpiresAt)
    }
    if (deadlines.length === 0) {
      await this.ctx.storage.deleteAlarm()
      return
    }

    await this.ctx.storage.setAlarm(Math.min(...deadlines))
  }

  #send(connection: Connection, message: ServerMessage): void {
    connection.send(serializeServerMessage(message))
  }

  #sendSnapshot(connection: Connection, selfId: string): void {
    if (!this.state) throw new Error('Cannot snapshot an unreserved room')
    this.#send(connection, createRoomSnapshot(this.state, selfId))
  }

  #broadcast(message: ServerMessage, without?: string[]): void {
    this.broadcast(serializeServerMessage(message), without)
  }

  #broadcastHostChanged(without?: string[]): void {
    if (!this.state?.hostId) return
    this.#broadcast({ t: 'hostChanged', hostId: this.state.hostId }, without)
  }

  #sendError(connection: Connection, code: RoomErrorCode, message: string): void {
    this.#send(connection, { t: 'error', code, message })
  }

  #rejectConnection(
    connection: Connection,
    code: RoomErrorCode,
    message: string,
  ): void {
    this.#sendError(connection, code, message)
    connection.close(1008, message)
  }
}
