# Stories

A numbered **folder** here is an **Epic**. A numbered **file** inside it is a
**Story / Task**. Numeric prefixes set the order.

Source of truth for scope and decisions: [`../architecture.md`](../architecture.md)
and the approved phase plan (`~/.claude/plans/hi-i-have-a-sunny-rossum.md`).

## Phase 1 epics

| Epic | Status | What |
|---|---|---|
| [`00-app-scaffold`](./00-app-scaffold/) | done | pnpm monorepo, web + server + shared, Worker + DO + D1 bindings, routing, CI |
| [`01-design-system`](./01-design-system/) | not started | Ember theme (`ember.css`), React primitive wrappers, keyframes, toasts |
| [`02-realtime-foundation`](./02-realtime-foundation/) | not started | `Room` DO state + hibernation lifecycle, message protocol, room codes, create/join, host reassignment, `partysocket` client, Zustand store |
| [`03-identity-auth`](./03-identity-auth/) | complete | better-auth (`anonymous`), D1 schema + migrations, guest minting, WS ticket auth, profile + favorites persistence, inert match-history tables |
| [`04-title-screen`](./04-title-screen/) | not started | animated CLASH tiles, wordmark, tagline, Play CTA |
| [`05-setup-screen`](./05-setup-screen/) | not started | name, avatar picker, create/join segmented control, room-code field |
| [`06-lobby-screen`](./06-lobby-screen/) | not started | RoomServer-backed lobby: players, ready, mode, favorite/copy, start dialog |
| [`07-gameplay-leaderboard`](./07-gameplay-leaderboard/) | planned | authoritative Wordle modes, match persistence, gameplay UI, account leaderboard |

## Verification

Not an epic. [`../verification.md`](../verification.md) is the reusable checklist
(baseline commands, local runbook, two-client realtime test, test suites) run
after **every** epic. Each epic README also has a short epic-specific
"Verification" section, and tests are written inside the epic that owns the code
they cover.

## Later phases

The gameplay and leaderboard phase is now planned as
[`07-gameplay-leaderboard`](./07-gameplay-leaderboard/). The bboy dance-off
minigame remains a separate future epic because its scoring/timing rules are
still forthcoming. Optional email/OAuth account linking also remains later work.
