import { SELF } from 'cloudflare:test'
import {
  describe,
  expect,
  it,
} from 'vitest'

const BASE = 'https://wordle-clash.test'

describe('Worker routing (Hono)', () => {
  it('GET /api/health -> 200 with the liveness JSON', async () => {
    const res = await SELF.fetch(`${BASE}/api/health`)
    expect(res.status).toBe(200)
    expect((await res.json()) as { ok: boolean }).toMatchObject({ ok: true })
  })

  it('GET /api/rooms -> 501 (POST-only route, wrong method falls through)', async () => {
    const res = await SELF.fetch(`${BASE}/api/rooms`)
    expect(res.status).toBe(501)
  })

  it('GET /api/unmatched -> 501', async () => {
    const res = await SELF.fetch(`${BASE}/api/unmatched`)
    expect(res.status).toBe(501)
  })
})
