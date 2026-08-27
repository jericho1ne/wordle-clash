# 04 · D1 + Drizzle setup

**Status:** done (schema and first migration completed in epic 03)

## Done

- `drizzle-orm` (server dep) + `drizzle-kit` (dev dep).
- `drizzle.config.ts` — `schema: ./src/db/schema.ts`, `out: ./migrations`,
  `dialect: sqlite`.
- `src/db/schema.ts` — placeholder (`export {}`) with a TODO listing the real
  tables (epic 03).
- `wrangler.jsonc` `d1_databases` binding `DB` + `migrations_dir: migrations`
  (story 02), placeholder `database_id`.
- Root + server scripts: `db:generate` (`drizzle-kit generate`),
  `db:migrate:local` / `db:migrate:remote`
  (`wrangler d1 migrations apply wordle-clash --local|--remote`).
- `apps/server/migrations/.gitkeep`.

## Follow-ups (epic 03-identity-auth/01)

- Completed by [`03-identity-auth/01`](../03-identity-auth/01-d1-schema.md): real
  database binding, schema, named migration, local application, and D1 client.

## Acceptance (this story)

- `drizzle.config.ts` type-checks; scripts are present. No migrations generated
  yet (intentional — schema is empty).
