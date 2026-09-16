# 06 · dev server + deploy

**Status:** done

## Decision

The approved plan suggested `@cloudflare/vite-plugin` for a single-process dev
server. That plugin assumes the Vite app and the Worker live in the same package;
our monorepo keeps them in separate packages. Rather than fight the
cross-package wiring, this scaffold uses the plan's stated fallback as the default:

- **Dev:** two processes — `vite` (`:5173`) and `wrangler dev` (`:8787`) — run in
  parallel from one command, `pnpm dev`. Vite proxies `/api` and `/ws` (with
  `ws: true`) to the Worker, so the browser only ever sees one origin.
- **Prod:** unchanged from the locked decision — the single Worker serves the
  web bundle with SPA fallback; one `wrangler deploy`.

Adopting `@cloudflare/vite-plugin` for a true single-process dev server later is
a clean, contained Vite configuration change.

## Done

- Vite proxy block; `WORKER_ORIGIN` env override; **no `base`**.
- The root `dev` script runs all applications in parallel
  (prefixed output; `--no-bail` so one crash doesn't kill the other);
  `dev:web` / `dev:server` for one side.
- Server `dev` script pre-creates the web output directory so
  `wrangler dev` doesn't error on the deploy-only `assets` binding before a
  build has run.
- Root `deploy` script: `pnpm build && wrangler deploy` from the server package.
- Architecture and verification documentation contain the runbook.

## Deploy prerequisites (not automated)

- `wrangler login`
- `wrangler d1 create wordle-clash` → configure the resulting `database_id`
- `wrangler secret put BETTER_AUTH_SECRET` / `RT_TICKET_SECRET` (epic 03)

## Acceptance

- `pnpm dev` brings up both; loading `http://localhost:5173` renders the SPA and
  `curl http://localhost:5173/api/health` succeeds through the proxy
  (→ `{"ok":true,...}`). Verified.
