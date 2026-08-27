# Epic 03 — Identity & auth (guest-first, invisible, additive)

**Status:** not started.

Constraints: no route/action ever requires an account; the anonymous identity is
invisible plumbing (no "log in" step, never shown as an account); an account is
purely additive (leaderboard history, saved avatar, cross-device favorites);
guest favorites/history stay device-local until an account exists; "link
email/OAuth" is a later post-match upsell.

## Stories

| # | Story |
|---|---|
| 00 | better-auth in the Worker: `drizzleAdapter(db, { provider: 'sqlite' })`, `anonymous()` plugin, `/api/auth/*`, user `additionalFields` `displayName` + `avatarId`. **Timebox ~1 day; fallback = HMAC-signed-cookie guest identity with the same table names.** |
| 01 | D1 schema (Drizzle) + first migration: better-auth core (+ `isAnonymous`, `displayName`, `avatarId`), `favorite_rooms` (`unique(userId, roomCode)`), **inert** `matches` + `match_players` (`match_players.userId` nullable). `wrangler d1 create` + real `database_id`. Generate with `--name=story_03_01__create__auth_favorites_matches` (see AGENTS.md → Database migrations). |
| 02 | Guest identity minting on client boot (`getSession()` → `signIn.anonymous()`), `useIdentity()`; never blocks render. |
| 03 | WS ticket auth: `POST /api/rt/ticket` → ~60s signed JWT → `partysocket` `query` → Worker verifies, strips, injects `x-user-*` headers → DO. |
| 04 | Profile `{ name, avatarId }`: `localStorage["wc.profile"]` source of truth + mirror to the user row via `updateUser` for every user (anon included). `useProfile()`. |
| 05 | Favorites abstraction: `useFavorites()` — anon → `localStorage["wc.favorites"]`; account → `/api/favorites` on `favorite_rooms`; one-time merge on future account link. |
| 06 | Inert match-history: document the tables, no-op `recordMatchResult()` with `// TODO(gameplay-epic)`, leaderboard filters `isAnonymous = false`. |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0. Epic-specific:

- `pnpm --filter @wordle-clash/server db:migrate:local` applies cleanly; the
  local D1 has the better-auth tables + `favorite_rooms` + inert `matches` /
  `match_players`.
- Fresh browser profile → title screen renders immediately; an anonymous session
  is minted in the background with **no login UI** and no navigation.
- Create + join a room with only the anonymous identity — no auth prompt anywhere.
- Favorite a room as a guest → persists in `localStorage`; nothing written to D1.
- WS connect uses a fresh `/api/rt/ticket` each time; a tampered/expired ticket is
  rejected at the Worker before reaching the DO.
- Set name/avatar → mirrored to the user row (`updateUser`) and survives reload.
