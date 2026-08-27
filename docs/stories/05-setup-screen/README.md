# Epic 05 — Setup screen

**Status:** not started (epic-00 placeholder in `src/features/setup/SetupScreen.tsx`).

## Stories

| # | Story |
|---|---|
| 00 | `/setup` route; ghost `<IconButton>` back arrow → `/`; read `?join=<code>` to preset mode + lock code; heading "Set up your player" |
| 01 | `<Field label="Your name">` + `<Input maxLength={14} placeholder="e.g. Nova">`; drives avatar initials; trim on submit; submit disabled while empty |
| 02 | Avatar picker: 5 circular 40px buttons, initial = `name[0]?.toUpperCase()`, bg/text from `AVATAR_STEPS[i]`; selected = 2px `--color-accent-300` border + `--shadow-sm`; stored as `avatarId` |
| 03 | `<SegmentedControl name="room-mode">` — "Create room" (Plus/DoorOpen) / "Join room" (SignIn); forced to `join` + disabled when `?join` present |
| 04 | Conditional `<Field label="Room code">` + `<Input>` when joining — placeholder "e.g. PLUM-742", `autoCapitalize="characters"`, `normalizeRoomCode` onChange, letter-spacing; locked/prefilled from `?join` |
| 05 | Submit: label "Create room" / "Join room"; disabled until name non-empty and (joining) `normalizeRoomCode(code).length >= 4`; persist profile then create (`POST /api/rooms` → `/room/:code`) or join (`/room/<normalized>`); failure → toast, stay |

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
