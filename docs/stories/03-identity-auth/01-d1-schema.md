# 01 · D1 schema + first migration

**Status:** done (pending review)

**Branch:** `feat/03-00-auth-d1-foundation` (stack layer 1, combined with 03-00)

## Done

- Replaced the scaffold schema with Better Auth's generated Drizzle schema:
  `user`, `session`, `account`, and `verification`.
- Added `favorite_rooms` with unique `(userId, roomCode)` rows.
- Added inert `matches` and `match_players` tables for the later gameplay epic;
  no Phase 1 code writes match results.
- Added the D1 Drizzle client and the real `wordle-clash` database ID.
- Generated
  `0000_story_03_01__create__auth_favorites_matches.sql`; Wrangler owns its
  migration ledger.

## Verification

- `pnpm --filter @wordle-clash/server db:migrate:local` applied the migration.
- Local D1 contains all seven application tables and accepted an anonymous user
  plus session through the Better Auth Worker handler.
- The remote migration has deliberately not been applied during implementation.
