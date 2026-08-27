# 02 · server — Worker + wrangler

**Status:** done

## Done

- `apps/server` — `@wordle-clash/server`.
- Deps: `partyserver`, `hono`, `drizzle-orm`, `@wordle-clash/shared`.
- Dev deps: `wrangler` 4, `@cloudflare/workers-types` 5,
  `@cloudflare/vitest-pool-workers`, `drizzle-kit`, `vitest`, `typescript`.
- `wrangler.jsonc` — `name: wordle-clash`, `main: src/index.ts`,
  `compatibility_date: 2026-08-01`, `compatibility_flags: ["nodejs_compat"]`,
  `observability.enabled`, plus:
  - `assets` — `directory: ../web/dist`, `binding: ASSETS`,
    `not_found_handling: single-page-application`.
  - `durable_objects.bindings` — `{ name: ROOM, class_name: Room }`.
  - `migrations` — `{ tag: v1, new_sqlite_classes: ["Room"] }`.
  - `d1_databases` — `{ binding: DB, database_name: wordle-clash, database_id:
    <placeholder>, migrations_dir: migrations }`.
- `src/index.ts` — `fetch` handler: `/api/health` → JSON; `/ws/*` →
  `routePartykitRequest(req, env, { prefix: 'ws' })`; other `/api/*` → 501 stub;
  everything else → `env.ASSETS.fetch(request)`. Re-exports `Room`.
- `worker-configuration.d.ts` — hand-written `Cloudflare.Env` stub; regenerate
  with `pnpm --filter @wordle-clash/server cf-typegen`.
- `.dev.vars.example` — `BETTER_AUTH_SECRET`, `RT_TICKET_SECRET`.
- `tsconfig.json` — `@cloudflare/workers-types`, shared path alias.

## Follow-ups

- `wrangler d1 create wordle-clash` → paste the real `database_id`.
- Replace the hand-written `worker-configuration.d.ts` with `wrangler types`
  output once bindings settle.
- Hono app for `/api/*` routes lands with epic 02.

## Acceptance

- `pnpm --filter @wordle-clash/server dev` boots `wrangler dev`.
- `curl localhost:8787/api/health` → `{ "ok": true, ... }`.
