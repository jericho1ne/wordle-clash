import { Hono } from 'hono'
import { routePartykitRequest } from 'partyserver'

import { createAuth } from './auth'
import { handleFavorites } from './favorites/routes'
import { handleCreateRoom } from './rooms/routes'
import {
  authorizeWebSocketRequest,
  handleRealtimeTicket,
} from './rt/routes'

export { Room } from './rooms/Room'

/**
 * Worker entry. Route table (see docs/stories/10-hono-api-restructure):
 *   /api/health            liveness probe
 *   /api/auth, /api/auth/* better-auth handler          (epic 03)
 *   /api/rt/ticket         mint a short-lived WS ticket  (epic 03) — POST, creates a ticket
 *   /api/rooms             reserve a room code           (epic 02) — POST, creates a reservation
 *   /api/favorites         favorites CRUD                (epic 03)
 *   /ws/room/:code         WebSocket -> Room DO
 *   *                      built SPA assets (SPA fallback)
 */
const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true, service: 'wordle-clash', ts: Date.now() }))

// better-auth dispatches its own methods internally, so both routes stay ALL.
app.all('/api/auth', (c) => createAuth(c.req.raw, c.env).handler(c.req.raw))
app.all('/api/auth/*', (c) => createAuth(c.req.raw, c.env).handler(c.req.raw))

// Strict POST: minting a ticket / reserving a room are creates, not safe/idempotent reads.
app.post('/api/rt/ticket', (c) => handleRealtimeTicket(c.req.raw, c.env))
app.post('/api/rooms', (c) => handleCreateRoom(c.req.raw, c.env))

// favorites/routes.ts dispatches GET/PUT/DELETE/POST itself, so this stays ALL.
app.all('/api/favorites', (c) => handleFavorites(c.req.raw, c.env))

app.all('/ws/*', async (c) => {
  const res = await routePartykitRequest(c.req.raw, c.env, {
    prefix: 'ws',
    onBeforeConnect: (socketRequest) => authorizeWebSocketRequest(socketRequest, c.env),
  })
  return res ?? c.text('room route not found', 404)
})

app.all('/api/*', (c) => c.text('not implemented', 501))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
