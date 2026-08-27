# Story 03-05 — Favorites abstraction

**Status:** done, pending review  
**Branch:** `feat/03-05-favorites-abstraction`

## Goal

Give lobby UI one favorites API while preserving the guest-first rule: anonymous
favorites never leave the device, and linked accounts sync favorites through D1.

## Implementation

- `FavoritesProvider` exposes `useFavorites()` with `favorites`, `isFavorite`,
  `toggle`, sync status, and errors.
- Anonymous and not-yet-ready identities read and write
  `localStorage["wc.favorites"]` only.
- Linked accounts use cookie-authenticated `GET /api/favorites`, `PUT
  /api/favorites`, and `DELETE /api/favorites` operations backed by
  `favorite_rooms`.
- On the first linked-account load, `POST /api/favorites` merges any guest codes
  into D1. The local key is removed only after the merge succeeds, making the
  migration one-time and retryable.
- The Worker rejects anonymous sessions at the favorites API boundary.
- The lobby placeholder includes a minimal Favorite button so guest persistence
  can be exercised before the full Epic 06 lobby UI lands.

## Verification

- Visit `/room/TEST-0001`, toggle Favorite, and confirm the button state and
  `wc.favorites` survive reload.
- In the Network panel, confirm guest toggles issue no `/api/favorites` request.
- As an anonymous session, `GET /api/favorites` returns `403 ACCOUNT_REQUIRED`
  and no `favorite_rooms` row is created.
- With a linked account, confirm the first load merges local codes with existing
  D1 codes, removes `wc.favorites`, and subsequent toggles use `PUT` / `DELETE`.
- Put malformed or invalid entries in `wc.favorites`; reload and confirm they are
  ignored without blocking render.
