import { routePartykitRequest } from 'partyserver'

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

    if (url.pathname.startsWith('/ws/')) {
      // epic 03 adds ticket verification + x-user-* header injection via the
      // `onBeforeConnect` hook here.
      const res = await routePartykitRequest(request, env, { prefix: 'ws' })
      return res ?? new Response('room route not found', { status: 404 })
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('not implemented', { status: 501 })
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
