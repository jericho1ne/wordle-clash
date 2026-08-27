# Story 03-04 — Profile persistence

**Status:** done, pending review  
**Branch:** `feat/03-04-profile-persistence`

## Goal

Keep the player profile available immediately without making identity startup or
network access a rendering dependency.

## Implementation

- `localStorage["wc.profile"]` is the source of truth for `{ name, avatarId }`.
- `ProfileProvider` hydrates local state synchronously and exposes
  `useProfile()` with `{ profile, setProfile }`.
- After the invisible Better Auth identity is ready, a local profile is mirrored
  to the current user row through `updateUser` (anonymous users included).
- If local storage has no valid profile, an existing profile from the user row is
  restored in the background and persisted locally.
- Names are trimmed and capped at 14 characters; avatar IDs are clamped to the
  shared avatar palette.

Profile sync failures do not clear or roll back the local profile. The next page
load reconciles it again.

## Verification

- Set a name and avatar through `setProfile`; confirm `wc.profile` contains the
  normalized profile and the current D1 user row matches it.
- Reload and confirm the profile is available before identity initialization
  completes.
- Remove `wc.profile`, reload, and confirm a profile already present on the user
  row is restored locally.
- Put malformed JSON in `wc.profile`; reload and confirm the app still renders.
