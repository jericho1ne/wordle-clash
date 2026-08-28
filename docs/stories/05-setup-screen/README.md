# Epic 05 — Setup screen

**Status:** not started (epic-00 placeholder in `src/features/setup/SetupScreen.tsx`).

## Stories

| # | Story | UI-testable slice |
|---|---|---|
| 00 | **Player setup form:** `/setup` shell and back navigation; `<Field>` / `<Input>` name control with 14-character limit, trimming, and live initials; accessible five-option avatar picker using `AVATAR_STEPS`; selected `avatarId` state | From the title screen, open Setup, enter a name, select every avatar with pointer and keyboard, and return home |
| 01 | **Create/join flow:** `<SegmentedControl>` for Create/Join; conditional normalized room-code input; locked `?join=<code>` deep-link state; validation and pending/error UI; persist the selected profile, create via `POST /api/rooms` or join the normalized code, then navigate to `/room/:code` | In two browser profiles, create a room in one window, join its code in the other, and land both players in the same lobby; invalid join remains on Setup with an error |

Each story is one PR layer and targets 600–800 changed implementation lines or
less. Story 01 is the stack's full frontend-to-backend vertical slice.

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0. Epic-specific:

- Name field caps at 14 chars; avatar initials update as you type; the 5 avatar
  swatches select with the accent-300 ring; keyboard-navigable.
- Segmented control toggles Create/Join; the room-code field only shows for Join.
- Submit is disabled until name is non-empty (and, for Join, code length ≥ 4).
- From `/setup` (no query) mode defaults to **Create**.
- Deep link `/setup?join=ABCD-1234` forces **Join**, prefills + locks the code,
  and the switch is disabled.
- Create → lands in `/room/<CODE>` as HOST; Join with a bad code → toast, stays
  on the screen.
- Profile (name + avatar) is set before navigation.

## Local UI flow

1. Start `pnpm dev` and open `http://localhost:5173` in a normal window and an
   incognito window.
2. In the normal window, open Setup, enter a name, choose an avatar, create a
   room, and confirm navigation to `/room/<CODE>` as host.
3. In incognito, open `/setup?join=<CODE>`, confirm Join and the normalized code
   are locked, choose a different profile, and submit.
4. Confirm both windows land in the same room and display two distinct players.
5. Try an unknown code and confirm Setup remains visible with an actionable
   error.
