import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { createRoom } from './room-entry'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createRoom', () => {
  it('returns a canonical room code from the create endpoint', async () => {
    const fetchMock = vi.fn(async () => Response.json(
      { roomCode: 'PLUM-7421' },
      { status: 201 },
    ))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createRoom()).resolves.toBe('PLUM-7421')
    expect(fetchMock).toHaveBeenCalledWith('/api/rooms', { method: 'POST' })
  })

  it('surfaces the server error message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { error: { message: 'Unable to reserve a room code' } },
      { status: 503 },
    )))

    await expect(createRoom()).rejects.toThrow('Unable to reserve a room code')
  })

  it('rejects malformed success responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      { roomCode: 'not-a-room' },
      { status: 201 },
    )))

    await expect(createRoom()).rejects.toThrow('Create room response is malformed')
  })
})
