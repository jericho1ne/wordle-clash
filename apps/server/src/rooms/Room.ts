import {
  Server,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from 'partyserver'

import {
  serializeServerMessage,
  type RoomState,
} from '@wordle-clash/shared'

import {
  createInitialRoomState,
  parseStoredRoomState,
  ROOM_STATE_STORAGE_KEY,
} from './state'

/**
 * SCAFFOLD STUB. One Durable Object instance per room, addressed by room code
 * (`this.name`). The authoritative in-memory + persisted room state, the
 * WebSocket message protocol, host reassignment, and the "match starting"
 * broadcast all land in epic 02-realtime-foundation. Ticket-based auth at the
 * connection boundary lands in epic 03-identity-auth.
 *
 * Hibernation is on: the DO can be evicted between messages, so `state` is
 * rehydrated from storage in `onStart()` and re-persisted on every mutation.
 */
export class Room extends Server<Env> {
  static override options = { hibernate: true }

  /** Authoritative room state. Mirror of the `state` storage key. */
  state: RoomState | null = null

  override async onStart(): Promise<void> {
    const storedState = await this.ctx.storage.get<unknown>(ROOM_STATE_STORAGE_KEY)
    this.state = storedState === undefined
      ? null
      : parseStoredRoomState(storedState)
  }

  async #save(): Promise<void> {
    if (!this.state) return
    await this.ctx.storage.put(
      ROOM_STATE_STORAGE_KEY,
      parseStoredRoomState(this.state),
    )
  }

  /** Ensure a state object exists (created lazily on first connect for now). */
  #ensureState(): RoomState {
    this.state ??= createInitialRoomState(this.name)
    return this.state
  }

  override async onConnect(connection: Connection, _ctx: ConnectionContext): Promise<void> {
    this.#ensureState()
    await this.#save()
    // epic 02: register the player, send a full roomState snapshot, broadcast join.
    connection.send(serializeServerMessage({
      t: 'error',
      code: 'BAD_MESSAGE',
      message: 'not implemented',
    }))
  }

  override async onMessage(_connection: Connection, _message: WSMessage): Promise<void> {
    // epic 02: zod-parse the frame and dispatch (setReady / setGameMode / ...).
  }

  override async onClose(_connection: Connection): Promise<void> {
    // epic 02: drop the socket, mark disconnected, schedule grace-period removal.
  }
}
