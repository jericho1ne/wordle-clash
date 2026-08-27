# 04 · D1 + Drizzle setup

**Status:** partial — config only

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

- `wrangler d1 create wordle-clash` → real `database_id` into `wrangler.jsonc`.
- Real schema: better-auth core tables (+ `isAnonymous`, `displayName`,
  `avatarId`), `favorite_rooms`, inert `matches` / `match_players`.
- `pnpm db:generate --name=story_<epic>_<story>__<action>__<group>` then
  `pnpm db:migrate:local` (see AGENTS.md → Database migrations).
- `src/db/client.ts` — `drizzle(env.DB, { schema })`.

## Acceptance (this story)

- `drizzle.config.ts` type-checks; scripts are present. No migrations generated
  yet (intentional — schema is empty).
