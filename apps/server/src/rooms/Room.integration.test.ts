import { env } from 'cloudflare:workers'
import {
  reset,
  SELF,
} from 'cloudflare:test'
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  MAX_PLAYERS,
  parseServerMessage,
  serializeClientMessage,
  type ServerMessage,
  type ServerMessageType,
} from '@wordle-clash/shared'

import {
  signRealtimeTicket,
  type RealtimeTicketIdentity,
} from '../rt/ticket'

const ROOM_CODE = 'TEST-0001'
const TEST_SECRET = 'test-only-secret-with-at-least-thirty-two-characters'

function identity(index: number): RealtimeTicketIdentity {
  return {
    userId: `player-${index}`,
    name: `Player ${index}`,
    avatarId: index % 5,
    animalId: index % 20,
    isAnonymous: true,
  }
}

class TestSocket {
  #messages: ServerMessage[] = []
  #waiters = new Set<() => void>()

  constructor(readonly socket: WebSocket) {
    socket.addEventListener('message', ({ data }) => {
      this.#messages.push(parseServerMessage(data))
      for (const notify of this.#waiters) notify()
      this.#waiters.clear()
    })
    socket.accept()
  }

  send(message: Parameters<typeof serializeClientMessage>[0]): void {
    this.socket.send(serializeClientMessage(message))
  }

  close(): void {
    this.socket.close(1000, 'Test complete')
  }

  async next<Type extends ServerMessageType>(
    type: Type,
  ): Promise<Extract<ServerMessage, { t: Type }>> {
    while (true) {
      const index = this.#messages.findIndex(({ t }) => t === type)
      if (index !== -1) {
        return this.#messages.splice(index, 1)[0] as Extract<ServerMessage, { t: Type }>
      }

      await new Promise<void>((resolve) => this.#waiters.add(resolve))
    }
  }
}

async function reserveRoom(ownerId = identity(0).userId): Promise<void> {
  const room = env.ROOM.getByName(ROOM_CODE)
  const reserved = await room.reserve(ownerId)
  if (!reserved) throw new Error('Unable to reserve test room')
}

async function connect(player: RealtimeTicketIdentity): Promise<TestSocket> {
  const ticket = await signRealtimeTicket(player, TEST_SECRET)
  const response = await SELF.fetch(
    `https://wordle-clash.test/ws/room/${ROOM_CODE}?ticket=${encodeURIComponent(ticket)}`,
    { headers: { Upgrade: 'websocket' } },
  )

  if (response.status !== 101 || !response.webSocket) {
    throw new Error(`Expected WebSocket upgrade, received ${response.status}`)
  }

  return new TestSocket(response.webSocket)
}

afterEach(async () => {
  await reset()
})

describe('Room Durable Object', () => {
  it('snapshots joins and broadcasts the second player', async () => {
    await reserveRoom()
    const host = await connect(identity(0))
    const hostSnapshot = await host.next('roomState')
    const guest = await connect(identity(1))
    const guestSnapshot = await guest.next('roomState')
    const joined = await host.next('playerJoined')

    expect(hostSnapshot.room.players).toHaveLength(1)
    expect(hostSnapshot.selfId).toBe(identity(0).userId)
    expect(guestSnapshot.room.players).toHaveLength(2)
    expect(joined.player.id).toBe(identity(1).userId)

    host.close()
    guest.close()
  })

  it('reassigns the host to the earliest remaining player', async () => {
    await reserveRoom()
    const host = await connect(identity(0))
    await host.next('roomState')
    const guest = await connect(identity(1))
    await guest.next('roomState')
    await host.next('playerJoined')

    host.send({ t: 'leave' })
    const hostChanged = await guest.next('hostChanged')

    expect(hostChanged.hostId).toBe(identity(1).userId)
    guest.close()
  })

  it('gates match start until every player is ready', async () => {
    await reserveRoom()
    const host = await connect(identity(0))
    await host.next('roomState')
    const guest = await connect(identity(1))
    await guest.next('roomState')
    await host.next('playerJoined')

    host.send({ t: 'startMatch' })
    const notReady = await host.next('error')
    expect(notReady.code).toBe('NOT_READY')

    host.send({ t: 'setReady', ready: true })
    guest.send({ t: 'setReady', ready: true })
    await host.next('playerUpdated')
    await host.next('playerUpdated')
    host.send({ t: 'startMatch' })

    const starting = await guest.next('matchStarting')
    expect(starting.playerCount).toBe(2)

    host.close()
    guest.close()
  })

  it('rejects malformed client frames', async () => {
    await reserveRoom()
    const host = await connect(identity(0))
    await host.next('roomState')

    host.socket.send('{bad json')
    const error = await host.next('error')

    expect(error.code).toBe('BAD_MESSAGE')
    host.close()
  })

  it('rejects a ninth distinct player', async () => {
    await reserveRoom()
    const sockets: TestSocket[] = []

    for (let index = 0; index < MAX_PLAYERS; index++) {
      const socket = await connect(identity(index))
      sockets.push(socket)
      await socket.next('roomState')
    }

    const overflow = await connect(identity(MAX_PLAYERS))
    const error = await overflow.next('error')
    expect(error.code).toBe('ROOM_FULL')

    for (const socket of sockets) socket.close()
    overflow.close()
  })
})
