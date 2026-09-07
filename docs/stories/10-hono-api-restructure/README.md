# Epic 10 — Hono API restructure

**Status:** not started

`apps/server/src/index.ts` routes every request through a hand-rolled `if
(url.pathname === ...)` chain. `hono` (`^4.13.5`) has been an `apps/server`
dependency since epic 00 for exactly this purpose —
[`00-app-scaffold/02-server-worker-wrangler.md`](../00-app-scaffold/02-server-worker-wrangler.md)
even left a follow-up note, "Hono app for `/api/*` routes lands with epic
02," that never got actioned. It's sat unused in `package.json` ever since.

This epic wires it up: replace the if-chain with a declarative `Hono` app
exposing the exact same routes and fallback behavior. No new dependency, no
behavior change, no route handler changes — purely a routing-layer
restructure so adding future `/api/*` endpoints is a one-line `app.get(...)`
instead of another `if` block.

## Dependencies

None — this only touches `apps/server/src/index.ts`. Route handlers
(`rooms/routes.ts`, `favorites/routes.ts`, `rt/routes.ts`, `auth.ts`) already
take `(request, env)` and return a `Response`, which maps directly onto
`(c.req.raw, c.env)` — no adapter work needed.

## Stories

| # | Story | Testable outcome |
|---|---|---|
| [00](./00-hono-api-restructure-plan.md) | Plan: current if-chain routes, target Hono app shape, explicit no-new-dependency / no-behavior-change scope | Reviewable implementation contract |
| [01](./01-hono-app-skeleton.md) | Replace the if-chain with a `Hono` app exposing the identical routes | Manual route-by-route check: same status/body as before |
| [02](./02-typed-env-bindings.md) | Type the Hono app's `Bindings` generic against the real `Env`, confirm the Worker export still typechecks | `pnpm --filter @wordle-clash/server typecheck` clean |
| [03](./03-route-tests.md) | `apps/server/src/index.test.ts` — regression tests for every route via `@cloudflare/vitest-pool-workers` | `pnpm --filter @wordle-clash/server test` passes |
| [04](./04-epic-verification.md) | Epic verification gate | `pnpm check` clean, two-client realtime smoke test still works |

## Verification

Baseline: [`../../verification.md`](../../verification.md), plus story 03's
route tests and story 04's manual `wrangler dev` smoke test above.
