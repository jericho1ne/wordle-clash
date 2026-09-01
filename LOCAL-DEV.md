# Local development

## Requirements

- Node.js 22 or newer
- pnpm 10.25.0
- A Cloudflare account for remote D1 and deployment work

## Setup

Install dependencies:

```sh
pnpm install
```

Copy the local Worker secrets template:

```sh
cp apps/server/.dev.vars.example apps/server/.dev.vars
```

Generate separate values for `BETTER_AUTH_SECRET` and `RT_TICKET_SECRET`:

```sh
openssl rand -base64 32
```

Place those runtime values in `apps/server/.dev.vars`. For a predictable local
game, uncomment `GAMEPLAY_TEST_ANSWER="CLASH"`.

Apply local D1 migrations:

```sh
pnpm db:migrate:local
```

Start the web app and Worker together:

```sh
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` and
`/ws` to the Worker on port 8787, so the browser uses one origin.

## Workspace

| Package                | Path              | Purpose                                     |
| ---------------------- | ----------------- | ------------------------------------------- |
| `@wordle-clash/web`    | `apps/web`        | Vite and React SPA                          |
| `@wordle-clash/server` | `apps/server`     | Cloudflare Worker and `Room` Durable Object |
| `@wordle-clash/shared` | `packages/shared` | Realtime protocol and shared domain types   |
| `@wordle-clash/e2e`    | `e2e`             | Playwright end-to-end tests                 |

## Scripts

| Command                          | Purpose                                                           |
| -------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                       | Run the web app and Worker together                               |
| `pnpm dev:web`                   | Run only Vite on port 5173                                        |
| `pnpm dev:server`                | Run only Wrangler on port 8787                                    |
| `pnpm build`                     | Build the shared package and production SPA                       |
| `pnpm typecheck`                 | Type-check every package                                          |
| `pnpm lint`                      | Run ESLint and Stylelint                                          |
| `pnpm format`                    | Apply ESLint, Prettier, and Stylelint formatting                  |
| `pnpm format:check`              | Check formatting without changing files                           |
| `pnpm test`                      | Run Vitest across the workspace                                   |
| `pnpm check`                     | Run the complete verification pipeline                            |
| `pnpm db:generate --name=<name>` | Generate a Drizzle migration                                      |
| `pnpm db:migrate:local`          | Apply migrations to local D1                                      |
| `pnpm db:migrate:remote`         | Apply migrations to production D1                                 |
| `pnpm run deploy`                | Build and deploy the SPA, Worker, Durable Object, and D1 bindings |

## Cloudflare credentials

Use `pnpm --filter @wordle-clash/server exec wrangler login` for interactive
local deployment, or provide `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` through your shell or CI environment. Do not put deploy
credentials in `apps/server/.env`: Wrangler loads that file as Worker runtime
bindings during local development.

`apps/server/.dev.vars` is only for application runtime values used locally.
Production runtime secrets are stored with `wrangler secret put`.

## Verification and architecture

- [`docs/verification.md`](./docs/verification.md) contains the complete local,
  two-browser, test, and deployment checks.
- [`docs/architecture.md`](./docs/architecture.md) explains the system and its
  constraints.
- [`AGENTS.md`](./AGENTS.md) defines the repository’s working conventions.
