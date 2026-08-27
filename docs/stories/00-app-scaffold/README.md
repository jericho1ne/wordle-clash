# Epic 00 — App scaffold

Stand up the monorepo and every binding the rest of Phase 1 builds on: web app,
Worker, shared package, Durable Object + D1 bindings, routing, CI.

No real product behaviour here — screens and realtime are placeholders wired to
the right shapes.

| # | Story | Status |
|---|---|---|
| 00 | [pnpm monorepo + workspaces](./00-pnpm-monorepo-workspaces.md) | done |
| 01 | [web: Vite + React 19 + TS](./01-web-vite-react19.md) | done |
| 02 | [server: Worker + wrangler](./02-server-worker-wrangler.md) | done |
| 03 | [Durable Object via partyserver](./03-durable-object-partyserver.md) | done (stub) |
| 04 | [D1 + Drizzle setup](./04-d1-drizzle-setup.md) | done (schema in epic 03) |
| 05 | [shared package](./05-shared-package.md) | done |
| 06 | [dev server + deploy](./06-dev-server-and-deploy.md) | done |
| 07 | [CI](./07-ci.md) | done |
| 08 | [routing (React Router)](./08-routing-react-router.md) | done |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0. Epic-specific:

- `pnpm install` resolves all four workspace packages.
- `pnpm dev` brings up both sides: the web app serves the three placeholder
  screens and routes between `/`, `/setup`, `/room/:code` (unknown paths → `/`);
  `curl localhost:5173/api/health` returns `{ ok: true }` through the proxy; a
  raw WS connect to `/ws/room/<code>` reaches the `Room` DO (currently replies
  with a not-implemented error frame).
- `pnpm --filter @wordle-clash/web build` produces `apps/web/dist`.
