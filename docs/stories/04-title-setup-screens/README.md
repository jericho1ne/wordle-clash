# Epic 04 — Title and setup screens

**Status:** complete; locally UI-verified.

Deliver the complete first-run path from the title screen through manual room
creation or joining. Invite-link generation and invited-player landing belong
to Epic 05.

## Stories

| # | Story | UI-testable slice |
|---|---|---|
| 00 | **Title screen:** finish `/` with the five animated **CLASH** logo tiles, Multiplayer kicker, Wordle Clash wordmark, tagline, reduced-motion behavior, and Play CTA | Load `/` under normal and throttled networking, verify the animation/reduced-motion variants, and use Play to reach Setup |
| 01 | **Player setup form:** finish the `/setup` shell and back navigation; add the 14-character name field with trimming and live initials; add an accessible five-option avatar picker backed by `AVATAR_STEPS` | Enter and edit a name, select every avatar with pointer and keyboard, and navigate between Title and Setup |
| 02 | **Manual create/join flow:** add the Create/Join segmented control, conditional normalized room-code input, validation and pending/error UI; persist the selected profile, create via `POST /api/rooms` or manually join a code, then navigate to `/room/:code` | In two browser profiles, create a room in one window, manually enter its code in the other, and land both players in the same lobby; an invalid code stays on Setup with an error |

The three stories are logical review slices delivered together on the user-owned
Epic 04 branch. The complete change targets 600–800 implementation lines or
less; Story 02 completes the frontend-to-backend vertical slice.

## Title requirements

- The title screen renders before invisible identity initialization completes.
- Logo tiles spell **C L A S H** in the prototype's fixed tile-state pattern.
- The tile row uses perspective and staggered `tileFlip` animation; users with
  `prefers-reduced-motion: reduce` see the finished state without animation.
- Copy: Multiplayer; Wordle Clash; “Race friends to the word. Guess smart, move
  fast, and claim the win.”; Play.

## Setup requirements

- Name is capped at 14 characters, drives avatar initials, and is trimmed on
  submit.
- The five avatar swatches expose an accessible selected state and use the
  shared avatar palette.
- Create is the default mode. Join reveals the room-code field and normalizes
  input with `normalizeRoomCode`.
- Submit is disabled until the name is non-empty and, when joining, the room
  code is valid.
- Profile is persisted before room creation/join navigation.

## Local UI flow

1. Start `pnpm dev` and open `http://localhost:5173` in a normal window and an
   incognito window.
2. Verify Title paints immediately, then use Play to reach Setup.
3. In the normal window, enter a name, choose an avatar, create a room, and
   confirm navigation to `/room/<CODE>` as host.
4. In incognito, use Setup's manual Join mode, enter the code with mixed casing
   or missing punctuation, choose a distinct profile, and submit.
5. Confirm both windows land in the same room with two distinct players.
6. Try an unknown code and confirm Setup remains visible with an actionable
   error.

## Verification

- Baseline: [`../../verification.md`](../../verification.md) §0.
- `pnpm --filter @wordle-clash/web test` covers title/setup component logic.
- The full Local UI flow above passes in two browser contexts.

## Implementation notes

- Title and Setup use adjacent SCSS Modules and Ember tokens exclusively.
- The avatar picker uses radio semantics, roving focus, arrow keys, Home, and
  End while retaining native button behavior.
- Manual room creation uses the authenticated `POST /api/rooms` endpoint.
- Manual joining opens a short authenticated Room connection before navigation,
  keeping authoritative unknown/full/started errors on Setup. The lobby
  reconnects the same identity inside the server's disconnect grace period.
