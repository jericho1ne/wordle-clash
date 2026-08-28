# Epic 06 — Lobby screen

**Status:** implemented; local two-client UI verification pending.

Wires the lobby UI to the `Room` Durable Object (epic 02) and D1 favorites
(epic 03), building on the invite-link surface from epic 05. No bots — real
remote players only.

The lobby also owns a softly mixed, looping soundtrack from
`public/lobby-music.mp3`. An Ember-styled Radix Toggle in the lower-left corner
provides explicit play/pause control and recovers when audible autoplay is
blocked by browser policy. Entering gameplay unmounts the lobby audio element
and pauses playback; returning to the lobby starts a fresh instance.

## Stories

| # | Story |
|---|---|
| 00 | Polish the existing `/room/:code` connection lifecycle: connecting state, reconnecting banner, terminal-error recovery, and `connect(code)` / `disconnect()` route ownership |
| 01 | Extend the epic-05 room-code card with favorite `<IconButton>` Star (ghost off / secondary + `weight="fill"` on) → `useFavorites().toggle` + toast |
| 02 | Game-mode `<SegmentedControl>` "Synchronous" / "Real-time" bound to `room.gameMode`; host-only edit; description paragraph from `GAME_MODES[...].description` |
| 03 | "Players · N" + list: 34px avatar, name, `<Tag tone="accent">YOU</Tag>` / `<Tag tone="neutral">HOST</Tag>`, right-aligned "✓ Ready" (`--color-accent-200`) / "Waiting…" (`--color-neutral-500`); non-self rows `joinIn 0.35s`; each `playerJoined` → toast "<name> joined the lobby" |
| 04 | Ready `<Button>`: secondary "I'm Ready" → ghost "✓ Ready"; `setReady(!self.ready)` optimistic |
| 05 | "Start game" primary block, host-only, disabled unless `players.length >= 2 && players.every(ready)`; hint line; `startMatch()` → server validates + broadcasts `matchStarting`; all clients open `<Dialog>` "Match starting" (`<mode> · <tries> tries · <playerCount> players` + subline + "Got it"). **TODO(gameplay-epic): replace dialog with navigation to `/room/:code/play`.** `phase → 'starting'`; late joiner → `error` "match already started" |
| 06 | Centralize lobby toasts through the one `<ToastProvider>` |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0 + the full
**two-client realtime test** in §2 (all steps), plus:

- `pnpm --filter @wordle-clash/e2e test` — single-context create flow (URL +
  HOST tag + player count); two-context join with cross-context player + ready
  visibility, host reassignment on context close, `matchStarting` dialog in both.
- Epic 05 invite-link routing remains intact while the lobby connects,
  disconnects, and recovers from transient Worker restarts.
- Non-host sees the game-mode control disabled and no "Start game" button.
- Start is disabled until ≥ 2 players and everyone ready; the hint line reflects
  why.

## Implementation notes

- `useRoomStore` owns optimistic ready/mode actions and retains the authoritative
  `matchStarting` payload long enough for every client to acknowledge it.
- One app-level `ToastProvider` handles invite, favorite, and player-join
  feedback. Lobby music remains independently controllable through Radix Toggle.
- The current match-start dialog deliberately stops at the gameplay boundary;
  Epic 07 replaces acknowledgement with navigation to the live game board.
