# 06 · dev server + deploy

**Status:** done

## Decision

The approved plan suggested `@cloudflare/vite-plugin` for a single-process dev
server. That plugin assumes the Vite app and the Worker live in the same package;
our monorepo keeps them split (`apps/web` vs `apps/server`). Rather than fight the
cross-package wiring, this scaffold uses the plan's stated fallback as the default:

- **Dev:** two processes — `vite` (`:5173`) and `wrangler dev` (`:8787`). Vite
  proxies `/api` and `/ws` (with `ws: true`) to the Worker, so the browser only
  ever sees one origin.
- **Prod:** unchanged from the locked decision — the single `apps/server` Worker
  serves `../web/dist` with SPA fallback; one `wrangler deploy`.

Adopting `@cloudflare/vite-plugin` later (single-process dev) is a clean,
contained change to `apps/web/vite.config.ts` and is noted there.

## Done

- `vite.config.ts` proxy block; `WORKER_ORIGIN` env override; **no `base`**.
- Root `deploy` script: `pnpm build && wrangler deploy` (from `apps/server`).
- `docs/architecture.md` documents the runbook.

## Deploy prerequisites (not automated)

- `wrangler login`
- `wrangler d1 create wordle-clash` → `database_id` into `wrangler.jsonc`
- `wrangler secret put AUTH_SECRET` / `RT_TICKET_SECRET` (epic 03)

## Acceptance

- With both dev processes up, loading `http://localhost:5173` renders the SPA and
  `fetch('/api/health')` from the browser succeeds through the proxy.
