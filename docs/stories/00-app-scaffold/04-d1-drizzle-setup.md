# 04 · D1 + Drizzle setup

**Status:** done (schema and first migration completed in epic 03)

## Done

- `drizzle-orm` (server dep) + `drizzle-kit` (dev dep).
- Drizzle configuration uses the SQLite dialect and generated migrations.
- A placeholder schema (`export {}`) with a TODO listing the real
  tables (epic 03).
- Worker configuration includes the `d1_databases` binding `DB` and migrations directory
  (story 02), placeholder `database_id`.
- Root + server scripts: `db:generate` (`drizzle-kit generate`),
  `db:migrate:local` / `db:migrate:remote`
  (`wrangler d1 migrations apply wordle-clash --local|--remote`).
- The empty migrations directory is retained in Git.

## Follow-ups (epic 03-identity-auth/01)

- Completed by [`03-identity-auth/01`](../03-identity-auth/01-d1-schema.md): real
  database binding, schema, named migration, local application, and D1 client.

## Acceptance (this story)

- Drizzle configuration type-checks; scripts are present. No migrations generated
  yet (intentional — schema is empty).
