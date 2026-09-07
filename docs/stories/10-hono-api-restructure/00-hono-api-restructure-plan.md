# 00 · Hono API restructure — plan

**Status:** not started

## Current state

`apps/server/src/index.ts` is the Worker entry (`wrangler.jsonc`'s `main`). Its
`fetch` handler matches every request with a hand-rolled if-chain on
`url.pathname`:

```
/api/health            -> inline JSON
/api/auth, /api/auth/*  -> createAuth(request, env).handler(request)
/api/rt/ticket          -> handleRealtimeTicket(request, env)
/api/rooms              -> handleCreateRoom(request, env)
/api/favorites          -> handleFavorites(request, env)
/ws/*                   -> routePartykitRequest(request, env, { prefix: 'ws', onBeforeConnect })
/api/* (unmatched)      -> 501 "not implemented"
* (everything else)     -> env.ASSETS.fetch(request) (SPA fallback)
```

`hono` (`^4.13.5`) has been an `apps/server` dependency since epic 00
(`docs/stories/00-app-scaffold/02-server-worker-wrangler.md`), which even left
a follow-up note — "Hono app for `/api/*` routes lands with epic 02" — that
was never actioned. It has sat unused in `package.json` ever since.

## Target

Replace the if-chain with a `Hono` app exposing the exact same routes and
fallback behavior. Method routing is **strict**, not `app.all` by default —
each route declares the HTTP method(s) its handler actually requires, per the
handler's own existing internal check:

```ts
const app = new Hono<{ Bindings: Env }>()
app.get('/api/health', ...)
app.all('/api/auth', ...)         // better-auth dispatches its own methods internally
app.all('/api/auth/*', ...)
app.post('/api/rt/ticket', ...)   // rt/routes.ts already 405s non-POST
app.post('/api/rooms', ...)       // rooms/routes.ts already 405s non-POST
app.all('/api/favorites', ...)    // favorites/routes.ts dispatches GET/PUT/DELETE/POST itself
app.all('/ws/*', ...)             // still delegates to routePartykitRequest
app.all('/api/*', ...)            // 501 fallback
app.all('*', ...)                 // SPA fallback
export default app
```

`/api/rt/ticket` stays **POST**, not GET: minting a ticket signs a new
short-lived credential, which is a side-effecting action, not a safe/
idempotent read — the wrong HTTP verb for something GET-cacheable or likely to
show up in a Referer header or access log.

Registering `/api/rt/ticket` and `/api/rooms` as `app.post` (rather than
`app.all`) is a deliberate, accepted behavior change from the current
if-chain: a non-POST request today gets the handler's own `405` with an
`Allow: POST` header; after this restructure it gets Hono's generic `404` for
an unmatched route instead. `/api/auth` and `/api/favorites` stay `app.all`
because their handlers genuinely dispatch on multiple methods themselves.

`export { Room }` and every binding in `wrangler.jsonc` (`main`,
`durable_objects`, `d1_databases`, `assets`) stay unchanged — this only
touches how requests get dispatched inside the Worker, not how the Worker
itself is registered or bound.

## Explicitly out of scope

- Route handlers (`rooms/routes.ts`, `favorites/routes.ts`, `rt/routes.ts`,
  `auth.ts`) are **not modified**. They already take `(request, env)` and
  return a `Response`, which is exactly `(c.req.raw, c.env)` / the value a
  Hono handler can return — no adapter needed.
- No new validation, no new middleware, no new routes. This epic is a
  refactor, not a feature.

## Stories

See `README.md` for the full breakdown and testable outcomes.
