import { routePartykitRequest } from 'partyserver'

import { createAuth } from './auth'
import {
  authorizeWebSocketRequest,
  handleRealtimeTicket,
} from './rt/routes'

export { Room } from './rooms/Room'

/**
 * Worker entry. Route table (see docs/stories/00-app-scaffold/02):
 *   /api/health            liveness probe
 *   /api/auth/*            better-auth handler        (epic 03)
 *   /api/rooms             reserve a room code        (epic 02)
 *   /api/rt/ticket         mint a short-lived WS ticket (epic 03)
 *   /api/favorites         favorites CRUD             (epic 03)
 *   /ws/room/:code         WebSocket -> Room DO
 *   *                      built SPA assets (SPA fallback)
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, service: 'wordle-clash', ts: Date.now() })
    }

    if (url.pathname === '/api/auth' || url.pathname.startsWith('/api/auth/')) {
      return createAuth(request, env).handler(request)
    }

    if (url.pathname === '/api/rt/ticket') {
      return handleRealtimeTicket(request, env)
    }

    if (url.pathname.startsWith('/ws/')) {
      const res = await routePartykitRequest(request, env, {
        prefix: 'ws',
        onBeforeConnect: (socketRequest) => authorizeWebSocketRequest(socketRequest, env),
      })
      return res ?? new Response('room route not found', { status: 404 })
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('not implemented', { status: 501 })
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
