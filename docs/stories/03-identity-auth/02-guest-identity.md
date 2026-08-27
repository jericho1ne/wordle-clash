# 02 · guest identity minting

**Status:** done (pending review)

**Branch:** `feat/03-02-guest-identity` (stack layer 1)

## Done

- Added the Better Auth React client with the anonymous client plugin.
- Added `IdentityProvider` at application boot; it restores an existing session
  or silently creates an anonymous user without delaying the first render.
- Added `useIdentity()` with `userId`, `isAnonymous`, `status`, and `error`.
- Added `ensureIdentity()` for socket code to await before requesting a realtime
  ticket.
- Deduplicated initialization at module scope so React Strict Mode does not mint
  two guests.

## Verification

- A fresh browser profile renders the title route immediately and creates one
  anonymous user/session in the background.
- Reloading restores the same user ID.
- Clearing site data and reloading creates a new anonymous identity.
- Auth initialization failure does not replace or block the application UI.
- Full repository verification remains pending review.
