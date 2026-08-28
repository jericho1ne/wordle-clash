# Epic 05 — Room invites

**Status:** implemented; local UI verification pending.

Let a host send a canonical room link using the device share sheet or clipboard,
then carry the recipient through guest profile setup into the live room. Invites
are link-based: no contacts permission, outbound email/SMS service, D1 invite
record, or separate invite token.

## Product contract

- Canonical invite URL: `${location.origin}/room/<CANONICAL_CODE>`.
- The room code identifies the Room Durable Object; the recipient still receives
  their own invisible authenticated guest identity before connecting.
- Room lifecycle is invite lifecycle. An expired, full, or started room cannot
  be joined; there is no independent invitation expiration or revocation state.
- The host may use the operating system share sheet when `navigator.share` is
  available. Otherwise the same action copies the full URL.
- Copy Code remains a separate action for friends joining manually.
- Share payload:
  - title: `Join my Wordle Clash room`
  - text: `Race me to the word in room <CODE>.`
  - URL: the canonical invite URL

## Stories

| # | Story | UI-testable slice |
|---|---|---|
| 00 | **Share an invite:** canonical invite URL helper; lobby room-code card; Invite friends action using `navigator.share` with clipboard fallback; separate Copy Code action; accessible success/failure feedback with temporary Check state | Create a room, invoke the native share sheet where supported, verify fallback URL copy, and verify Copy Code writes only the canonical code |
| 01 | **Open an invite:** canonical `/room/:code` handling; if no saved profile, redirect to `/setup?join=<code>`; force Join mode and lock the normalized code; after profile submit, enter the room; handle `ROOM_NOT_FOUND`, `ROOM_FULL`, and `MATCH_STARTED` with actionable navigation | Copy an invite from one browser profile, open it in incognito, create a distinct profile, and join the same lobby; verify invalid/expired/full/started links do not loop or reconnect forever |
| 02 | **Animal avatars:** preserve the five-color picker; preselect a random choice from 20 bundled animal SVGs on every Setup load; offer all animals in a 4×5 dropdown; persist the numeric animal ID through Better Auth, D1, realtime tickets, and room state; render the colored animal avatar in the lobby | Load Setup repeatedly to verify randomized defaults, choose distinct color/animal combinations in two browser contexts, join the same room, and verify both combinations render consistently for both players |

Each story is one PR layer and targets 600–800 changed implementation lines or
less. Story 01 completes the share-to-join vertical slice.

## Local UI flow

1. Start `pnpm dev`; create a room in a normal browser window.
2. Select Invite friends. If the browser supports Web Share, inspect the native
   payload; otherwise confirm the full `/room/<CODE>` URL reaches the clipboard.
3. Confirm Copy Code writes only `<CODE>` and both actions expose accessible
   success feedback.
4. Open the full invite URL in incognito. Confirm redirect to
   `/setup?join=<CODE>`, with Join and the canonical code locked.
5. Enter a different player profile and submit. Confirm both browser contexts
   show the same two-player room.
6. Repeat with an unknown or expired code and confirm a clear error returns the
   recipient to Setup without a reconnect loop.
7. Confirm Create/Join stays disabled until an animal is selected, then verify
   each player's chosen color and animal appear in both lobby windows.

## Verification

- Baseline: [`../../verification.md`](../../verification.md) §0.
- Unit coverage for canonical URLs, share capability selection, and clipboard
  fallback.
- Two-browser invite flow passes through the real Worker and Room Durable Object.
- Animal selection is keyboard-accessible and required before room entry.

## Implementation notes

- `features/lobby/invite.ts` owns canonical URLs, native sharing, and clipboard
  behavior; the lobby keeps invite-link and room-code actions distinct.
- `/room/:code` checks for a stored profile before rendering the lobby. New
  recipients are sent to locked Join setup and enter the live room only after
  profile persistence and authoritative room validation succeed.
- Terminal room errors stop socket reconnection and offer a direct path back to
  unlocked room setup.
- `avatarId` remains the five-color index. The separate `animalId` maps to the
  stable animal filename list in shared code; filenames never enter D1 or the
  realtime protocol.
