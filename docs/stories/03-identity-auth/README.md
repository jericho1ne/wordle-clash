# Epic 03 — Identity & auth (guest-first, invisible, additive)

**Status:** complete through 03-05; 03-07 username/password accounts in progress.

Constraints: no route/action ever requires an account; the anonymous identity is
invisible plumbing (no "log in" step, never shown as an account); an account is
purely additive (leaderboard history, saved avatar, cross-device favorites);
guest favorites/history stay device-local until an account exists; "link
email/OAuth" is a later post-match upsell.

## Stories

| # | Story | Status |
|---|---|---|
| [00](./00-better-auth-worker.md) | better-auth in the Worker: `drizzleAdapter(db, { provider: 'sqlite' })`, `anonymous()` plugin, `/api/auth/*`, user `additionalFields` `displayName` + `avatarId`. **Timebox ~1 day; fallback = HMAC-signed-cookie guest identity with the same table names.** | done, in review |
| [01](./01-d1-schema.md) | D1 schema (Drizzle) + first migration: better-auth core (+ `isAnonymous`, `displayName`, `avatarId`), `favorite_rooms` (`unique(userId, roomCode)`), **inert** `matches` + `match_players` (`match_players.userId` nullable). `wrangler d1 create` + real `database_id`. Generate with `--name=story_03_01__create__auth_favorites_matches` (see AGENTS.md → Database migrations). | done, in review |
| [02](./02-guest-identity.md) | Guest identity minting on client boot (`getSession()` → `signIn.anonymous()`), `useIdentity()`; never blocks render. | done, in review |
| [03](./03-ws-ticket-auth.md) | WS ticket auth: `POST /api/rt/ticket` → ~60s signed JWT → `partysocket` `query` → Worker verifies, strips, injects `x-user-*` headers → DO. | done, in review |
| [04](./04-profile-persistence.md) | Profile `{ name, avatarId }`: `localStorage["wc.profile"]` source of truth + mirror to the user row via `updateUser` for every user (anon included). `useProfile()`. | done, in review |
| [05](./05-favorites-abstraction.md) | Favorites abstraction: `useFavorites()` — anon → `localStorage["wc.favorites"]`; account → `/api/favorites` on `favorite_rooms`; one-time merge on future account link. | done, in review |
| 06 | Inert match-history placeholder | deferred to [Epic 07 Stories 07–08](../07-gameplay-leaderboard/README.md) so persistence and leaderboard queries are implemented against real gameplay state rather than a no-op API |
| 07 | Username/password accounts: Better Auth credential + username plugins, guest-account profile preservation, and a landing-page sign-up/sign-in flow | in progress |

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
