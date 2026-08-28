# Story 02-08 — Zustand room store

**Status:** done, pending review.

## Scope

- Own the active `RoomSocket` in one Zustand store with explicit idle,
  connecting, connected, reconnecting, and terminal states.
- Reduce every lobby protocol event into the latest authoritative room state.
- Apply `setReady` optimistically, track it in `pendingActions`, acknowledge it
  from the matching server event or snapshot, and re-send it after reconnect.
- Expose selector-friendly state and actions to React without exposing
  PartySocket itself.
- Replace the lobby's temporary socket effect with the store and display a live
  player list plus ready-state control as a thin integration slice.

## Acceptance

- Two browser profiles in one room see joins, departures, host changes, and
  ready changes without refreshing.
- Clicking `Ready up` updates immediately and converges on the server event.
- If the Worker drops after an optimistic ready change, the pending action is
  sent again once the socket reconnects.
- Navigating away closes the active socket and clears room state.
- A terminal join error is preserved instead of being overwritten by the close
  event.

## Verification

- Start `pnpm dev`, reserve a room, then open its URL in a normal and incognito
  window so each browser has a distinct guest identity.
- Confirm both names appear in both windows and Ready/Not ready changes propagate.
- Stop and restart the Worker; confirm both windows return from Reconnecting to
  Connected and retain the server snapshot.
