# Epic 07 — Gameplay & leaderboard

**Status:** planned (Story 07-00 done, pending review; implementation blocked on
Epic 02 realtime foundation and the minimal Epic 06 lobby connection path).

The `Room` Durable Object remains authoritative for the secret answer, guesses,
timers, scoring, winners, and match termination. Clients receive only the state
and tile feedback they are allowed to render. There is no guess dictionary: any
five-letter string is accepted.

See the [guess submission flow](./guess-submission-flow.md) for the persistence
and WebSocket event sequence.

## Dependencies

The implementation stack completes these foundations before Story 07-01:

1. Epic 02 message protocol, Room persistence/lifecycle, create/join API,
   PartySocket client, room store, and Worker integration tests.
2. Epic 04's create/join path and Epic 05's invited-player join path.
3. Epic 06 lobby connection, player list, ready/mode/start controls, and the
   `/room/:code/play` handoff.

## Stories

| # | Story | Testable outcome |
|---|---|---|
| [00](./00-gameplay-leaderboard-plan.md) | Stack plan, rules boundary, and leaderboard ordering | Reviewable implementation contract |
| 01 | Gameplay domain: answer-pool loader, five-letter validation, duplicate-letter tile evaluator, deterministic answer injection for tests | Evaluator runs without a room |
| 02 | Gameplay WebSocket protocol: match snapshots, guesses, tile results, round close, match end, and tiebreak handoff | Shared round-trip protocol tests |
| 03 | Authoritative match lifecycle in `Room`: start validation, secret selection, persisted gameplay state, reconnect snapshot, no secret leakage | Two clients enter the same match |
| 04 | Real-time race: immediate guesses/results, first-correct atomic win, ten-guess elimination, no-winner termination | Two clients race live |
| 05 | Synchronous rounds: private submissions, 60-second alarm deadline, early close when all submit, simultaneous reveal, five-round termination | Two clients reveal together |
| 06 | Multi-winner tiebreak boundary: transition tied correct players into a persisted `tiebreak` phase and expose versioned `danceOff*` extension points | Tie does not choose an invented winner |
| 07 | Match persistence: write `matches` / account-owned `match_players` once at terminal state; guest history remains device-local | Completed account matches appear in D1 |
| 08 | Leaderboard API: authenticated and public reads, wins → win rate → average guesses ordering, pagination, anonymous exclusion | Ranked JSON response |
| 09 | Gameplay client store: reconnect-safe snapshots/events, pending guess handling, terminal-state recovery | Refresh restores the match |
| 10 | Shared gameplay UI: `/room/:code/play`, board, keyboard/input, tile feedback, status and reconnect states | A player can submit guesses visually |
| 11 | Real-time gameplay screen: live opponent progress, elimination, first-winner and no-winner results | Playable real-time match UI |
| 12 | Synchronous gameplay screen: countdown, submitted/locked state, simultaneous reveal, round progression | Playable synchronous match UI |
| 13 | Match results and local guest history; account history reads persisted matches | Results survive navigation/reload |
| 14 | Leaderboard UI with ranking, player stats, empty/error/loading states, and optional-account messaging | Leaderboard visible in the app |
| 15 | Full Worker, shared, web, and two-browser verification; production-safe timer/reconnect/race hardening | Epic verification gate passes |

## Leaderboard ordering

Only players whose match-time identity was a linked account are eligible.
Ranking is deterministic:

1. total wins, descending;
2. win rate, descending;
3. average guesses used in solved matches, ascending;
4. display name, ascending;
5. user ID, ascending.

Guest participant rows are not inserted into D1. Their results stay in local
history, so linking that anonymous identity later cannot make guest-era results
leaderboard-eligible retroactively. A `match_players.userId` may still become
null when a previously linked account is deleted.

## Dance-off boundary

The product rules intentionally leave the tap/rhythm minigame undefined. This
epic will implement the authoritative transition into `tiebreak`, persist the
eligible players, and define versioned `danceOff*` protocol extension points. It
will not invent scoring, timing, or winner rules. The minigame becomes a separate
epic once those rules are approved.

## Verification

Baseline: [`../../verification.md`](../../verification.md), plus:

- deterministic duplicate-letter evaluator cases;
- two-client real-time atomic-winner and exhaustion cases;
- two-client synchronous hidden-submission, early-close, timer-close, and tie
  cases;
- Worker restart/reconnect during lobby, active round, and terminal match;
- exactly-once match persistence;
- guest results remain device-local and excluded from D1 match-player rows;
- leaderboard ordering and pagination;
- two real browser contexts completing each mode through the UI.
