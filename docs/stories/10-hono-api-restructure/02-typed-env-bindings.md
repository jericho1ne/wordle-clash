# 02 · Typed env bindings

**Status:** not started

## Scope

Confirm the Hono app's `Bindings` generic lines up with this project's real
`Env` type end to end:

- `new Hono<{ Bindings: Env }>()` typechecks against the `Env` interface from
  `worker-configuration.d.ts` (regenerate via `pnpm --filter @wordle-clash/server
  cf-typegen` first if it's stale).
- `c.env` inside each route handler has the same shape the old `env` parameter
  did — no `as any` / type-widening needed to call `createAuth(request, env)`,
  `handleCreateRoom(request, env)`, etc.
- The Worker's default export (the Hono `app` instance) still satisfies
  whatever Cloudflare's Worker types expect as a module export (Hono's `App`
  type already implements the `fetch` contract `ExportedHandler<Env>` needs;
  confirm there's no leftover `satisfies ExportedHandler<Env>` annotation that
  no longer applies now that the export is a Hono app rather than a plain
  object literal).

## Testable outcome

`pnpm --filter @wordle-clash/server typecheck` passes with zero new errors or
suppressions introduced by the routing change.
