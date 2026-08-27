# Wordle Clash

A multiplayer (2–8 player) Wordle race. Create or join a room by code, pick a
mode in the lobby, and race friends to the word.

- **Architecture & all technical decisions:** [`docs/architecture.md`](./docs/architecture.md)
- **Epic / story breakdown:** [`docs/stories/`](./docs/stories/) — a numbered
  folder is an Epic, a numbered file inside it is a Story/Task.
- **Verification checklist** (run after every epic): [`docs/verification.md`](./docs/verification.md)
- **Gameplay rules** (later phases): [`docs/game-rules.md`](./docs/game-rules.md)

## Status

Phase 1 — foundation + the title → setup → lobby screens. Wordle gameplay is a
later phase (see the architecture doc's "Out of scope" section).

## Workspace

| Package | Path | What |
|---|---|---|
| `@wordle-clash/web` | `apps/web` | Vite + React 19 SPA |
| `@wordle-clash/server` | `apps/server` | Cloudflare Worker + `Room` Durable Object |
| `@wordle-clash/shared` | `packages/shared` | Protocol / room types, room codes, game modes, avatars |
| `@wordle-clash/e2e` | `e2e` | Playwright end-to-end tests |

## Quick start

```sh
pnpm install

# two terminals:
pnpm --filter @wordle-clash/server dev   # wrangler dev -> http://localhost:8787
pnpm --filter @wordle-clash/web dev      # vite         -> http://localhost:5173
```

Open http://localhost:5173. See [`docs/architecture.md`](./docs/architecture.md)
for the full dev and deploy runbook.

## Scripts (root)

| Script | Does |
|---|---|
| `pnpm dev` | Vite dev server for the web app |
| `pnpm build` | Build `shared` then `web` |
| `pnpm typecheck` | `tsc --noEmit` across all packages |
| `pnpm lint` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm test` | Vitest across all packages |
| `pnpm db:generate` | `drizzle-kit generate` (server) |
| `pnpm db:migrate:local` / `:remote` | Apply D1 migrations |
| `pnpm deploy` | Build, then `wrangler deploy` (assets + Worker + DO + D1) |
