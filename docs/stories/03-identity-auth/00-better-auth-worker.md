# 00 · better-auth Worker integration

**Status:** done (pending review)

**Branch:** `feat/03-00-auth-d1-foundation` (stack layer 1)

## Done

- Added stable `better-auth` 1.7 with the anonymous plugin.
- Added a request-scoped auth factory backed by the Worker `DB` binding through
  the Drizzle SQLite adapter.
- Mounted Better Auth at `/api/auth/*` without adding a separate origin or CORS
  boundary.
- Trusts the exact Vite development origins while requests are proxied to the
  local Worker; deployed requests remain same-origin only.
- Added optional `displayName` and `avatarId` user fields.
- Enforced a minimum 32-character `BETTER_AUTH_SECRET`; the value remains a Worker
  runtime secret in `.dev.vars` locally and `wrangler secret` in production.

## Verification

- Workerd smoke test: `GET /api/auth/get-session` returns `null` before sign-in.
- `POST /api/auth/sign-in/anonymous` creates an anonymous user and sets an
  HttpOnly, same-site session cookie.
- Reusing the cookie returns the same session and user with `isAnonymous: true`,
  `displayName`, and `avatarId`.
- Full repository verification remains pending review.
