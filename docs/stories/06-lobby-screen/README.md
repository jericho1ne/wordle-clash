# Epic 06 — Lobby screen

**Status:** not started (epic-00 placeholder in `src/features/lobby/LobbyScreen.tsx`).

Wires the lobby UI to the `Room` Durable Object (epic 02) and D1 favorites
(epic 03). No bots — real remote players only.

## Stories

| # | Story |
|---|---|
| 00 | `/room/:code` route + deep-link guard (no profile → `/setup?join=<code>`); `connect(code)` on mount / `disconnect()` on unmount; connection states (connecting / `ROOM_NOT_FOUND` → toast+`/setup` / `ROOM_FULL` → toast+back / reconnecting banner); canonical-code redirect |
| 01 | Room-code card (`<Card elevation="md">`, monospace 22px); favorite `<IconButton>` Star (ghost off / secondary + `weight="fill"` on) → `useFavorites().toggle` + toast; copy `<IconButton>` → `navigator.clipboard.writeText` + toast (swap to Check ~1s); meta "Share this code so friends can join" |
| 02 | Game-mode `<SegmentedControl>` "Synchronous" / "Real-time" bound to `room.gameMode`; host-only edit; description paragraph from `GAME_MODES[...].description` |
| 03 | "Players · N" + list: 34px avatar, name, `<Tag tone="accent">YOU</Tag>` / `<Tag tone="neutral">HOST</Tag>`, right-aligned "✓ Ready" (`--color-accent-200`) / "Waiting…" (`--color-neutral-500`); non-self rows `joinIn 0.35s`; each `playerJoined` → toast "<name> joined the lobby" |
| 04 | Ready `<Button>`: secondary "Ready up" → ghost "✓ Ready"; `setReady(!self.ready)` optimistic |
| 05 | "Start game" primary block, host-only, disabled unless `players.length >= 2 && players.every(ready)`; hint line; `startMatch()` → server validates + broadcasts `matchStarting`; all clients open `<Dialog>` "Match starting" (`<mode> · <tries> tries · <playerCount> players` + subline + "Got it"). **TODO(gameplay-epic): replace dialog with navigation to `/room/:code/play`.** `phase → 'starting'`; late joiner → `error` "match already started" |
| 06 | Centralize lobby toasts through the one `<ToastProvider>` |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0 + the full
**two-client realtime test** in §2 (all steps), plus:

- `pnpm --filter @wordle-clash/e2e test` — single-context create flow (URL +
  HOST tag + player count); two-context join with cross-context player + ready
  visibility, host reassignment on context close, `matchStarting` dialog in both.
- Deep-linking `/room/<CODE>` with no profile redirects to `/setup?join=<CODE>`.
- Non-canonical code in the URL (`abcd1234`) redirects to the canonical
  `ABCD-1234`.
- `ROOM_NOT_FOUND` → toast + back to `/setup`; `ROOM_FULL` → toast + back.
- Non-host sees the game-mode control disabled and no "Start game" button.
- Start is disabled until ≥ 2 players and everyone ready; the hint line reflects
  why.
