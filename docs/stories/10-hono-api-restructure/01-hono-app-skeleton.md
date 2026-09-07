# 01 · Hono app skeleton

**Status:** not started

## Scope

Replace the if-chain in `apps/server/src/index.ts` with a `new Hono<{
Bindings: Env }>()` app that exposes the identical routes and fallback
behavior described in `00-hono-api-restructure-plan.md`, with strict
per-route HTTP methods matching what each handler actually requires (see the
POST-vs-`Allow` note below for the one accepted behavior change):

- `GET /api/health` — same inline JSON body.
- `ALL /api/auth` and `ALL /api/auth/*` — delegates to `createAuth(request,
  env).handler(request)`; `ALL` because better-auth dispatches its own
  methods internally.
- `POST /api/rt/ticket` — delegates to `handleRealtimeTicket`. Strict POST:
  minting a ticket is a side-effecting create, not a safe/idempotent GET. A
  non-POST request now falls through to the `/api/*` catch-all below and gets
  a `501`, instead of the handler's own `405` + `Allow: POST` — an accepted,
  deliberate behavior change (see plan doc), confirmed against a live
  `wrangler dev`.
- `POST /api/rooms` — delegates to `handleCreateRoom`. Same reasoning: it
  creates a room reservation, so it's a CRUD create — strictly POST. Same
  `501` fallthrough as above.
- `ALL /api/favorites` — delegates to `handleFavorites`, which dispatches
  GET/PUT/DELETE/POST itself.
- `ALL /ws/*` — delegates to `routePartykitRequest(c.req.raw, c.env, { prefix:
  'ws', onBeforeConnect: (r) => authorizeWebSocketRequest(r, c.env) })`, 404
  fallback preserved for no match.
- `ALL /api/*` — 501 `"not implemented"` fallback for anything else under
  `/api/`.
- `ALL *` — `c.env.ASSETS.fetch(c.req.raw)` (SPA fallback).

`export { Room } from './rooms/Room'` stays as-is. `wrangler.jsonc`'s `main`
(`src/index.ts`) is unchanged — Hono's app object is a valid default export
for a Worker (it has a `fetch` method), so no other config moves.

## Testable outcome

`pnpm --filter @wordle-clash/server dev` boots, and manually hitting each
route above (via `curl` or the browser) returns the same status/body as
before the change. No route handler file changes.
