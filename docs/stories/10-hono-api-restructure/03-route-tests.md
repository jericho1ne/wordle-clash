# 03 · Route tests

**Status:** not started

## Scope

Add `apps/server/src/index.test.ts` using the existing
`@cloudflare/vitest-pool-workers` setup (see `apps/server/src/rooms/
Room.integration.test.ts` for the harness pattern already in this package),
asserting the migrated Hono app's behavior matches the pre-migration if-chain
for every route:

- `GET /api/health` → `200`, `{ ok: true, service: 'wordle-clash', ts:
  <number> }`.
- `GET /api/unknown-thing` (or any unmatched `/api/*` path) → `501`.
- `GET /ws/room/does-not-exist` (or the minimal request shape
  `routePartykitRequest` needs) → still reaches the `Room` Durable Object
  rather than falling through to the 501 or SPA branches.
- `GET /some/spa/route` (unmatched, not under `/api/` or `/ws/`) → falls back
  to `env.ASSETS.fetch`.

These are regression tests for the restructure itself, not new coverage of
`createAuth`/`handleCreateRoom`/`handleFavorites` internals — those already
have (or don't have) their own tests and are out of scope here per
`00-hono-api-restructure-plan.md`.

## Testable outcome

`pnpm --filter @wordle-clash/server test` includes and passes the new
`index.test.ts` suite.
