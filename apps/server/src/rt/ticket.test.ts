import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  REALTIME_TICKET_TTL_SECONDS,
  signRealtimeTicket,
  verifyRealtimeTicket,
} from './ticket'

const SECRET = 'test-only-realtime-ticket-secret-at-least-32-characters'
const NOW = new Date('2026-08-27T21:00:00.000Z')
const IDENTITY = {
  userId: 'guest-123',
  name: 'Nova',
  avatarId: 2,
  isAnonymous: true,
}

describe('realtime ticket', () => {
  it('round-trips identity claims', async () => {
    const ticket = await signRealtimeTicket(IDENTITY, SECRET, NOW)

    await expect(verifyRealtimeTicket(ticket, SECRET, NOW)).resolves.toEqual(IDENTITY)
  })

  it('rejects a tampered signature', async () => {
    const ticket = await signRealtimeTicket(IDENTITY, SECRET, NOW)
    const tampered = `${ticket}x`

    await expect(verifyRealtimeTicket(tampered, SECRET, NOW)).rejects.toThrow()
  })

  it('rejects an expired ticket', async () => {
    const ticket = await signRealtimeTicket(IDENTITY, SECRET, NOW)
    const expiredAt = new Date(NOW.getTime() + (REALTIME_TICKET_TTL_SECONDS + 1) * 1_000)

    await expect(verifyRealtimeTicket(ticket, SECRET, expiredAt)).rejects.toThrow()
  })
})
