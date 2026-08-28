# Story 02-05 — Host reassignment

**Status:** done, pending review  
**Branch:** `feat/02-05-host-reassignment`

## Goal

Keep exactly one connected host whenever possible, with deterministic authority
transfer after the current host leaves.

## Implementation

- Select the earliest connected player by `joinedAt`, with user ID as a stable
  timestamp tie-break.
- Update `room.hostId` and all player `isHost` flags together.
- Reassign only after explicit leave or disconnect-grace removal; a transient
  host disconnect retains authority during the grace window.
- Broadcast the final host in both `playerLeft.hostId` and a `hostChanged` event.
- Fill a vacant host slot when an existing player reconnects or a new player
  joins an abandoned room.

## Verification

- Connect three players, remove the host, and confirm the earliest connected
  remaining player becomes host in every client snapshot.
- Confirm closing one of multiple host tabs does not reassign the host.
- Confirm a disconnected non-host is skipped during reassignment.
