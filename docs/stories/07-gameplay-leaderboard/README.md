# Epic 07 — Gameplay & leaderboard

**Status:** gameplay implemented; match-history persistence and leaderboard deferred.

The `Room` Durable Object remains authoritative for the secret answer, guesses,
timers, scoring, winners, and match termination. Clients receive only the state
and tile feedback they are allowed to render. Guesses must appear in the bundled
server-only Wordle allow-list.

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
| 01 | **Done:** gameplay domain, five-letter validation, duplicate-letter evaluator, and server-only answer pool | Evaluator runs without a room |
| 02 | **Done:** gameplay WebSocket messages and validated sanitized snapshots | Shared round-trip protocol tests |
| 03 | **Done:** authoritative persisted `Room` match lifecycle and reconnect snapshot | Two clients enter the same match |
| 04 | **Done:** real-time race, atomic winner, ten-guess elimination, no-winner termination | Two clients race live |
| 05 | **Done:** private synchronous submissions, host-selected 1/3/5-minute deadline plus 400ms network grace, early reveal, five-round termination | Two clients reveal together |
| 06 | **Done:** persisted multi-winner `tiebreak` boundary | Tie does not choose an invented winner |
| 07 | Match persistence: write `matches` / account-owned `match_players` once at terminal state; guest history remains device-local | Completed account matches appear in D1 |
| 08 | Leaderboard API: authenticated and public reads, wins → win rate → average guesses ordering, pagination, anonymous exclusion | Ranked JSON response |
| 09 | **Done:** reconnect-safe gameplay snapshots and terminal-state recovery | Refresh restores the match |
| 10 | **Done:** `/room/:code/play`, boards, guess input, tile feedback, and status | A player can submit guesses visually |
| 11 | **Done:** live opponent progress, elimination, winner and no-winner results | Playable real-time match UI |
| 12 | **Done:** countdown, locked state, simultaneous reveal, round progression | Playable synchronous match UI |
| 13 | Match results and local guest history; account history reads persisted matches | Results survive navigation/reload |
| 14 | Leaderboard UI with ranking, player stats, empty/error/loading states, and optional-account messaging | Leaderboard visible in the app |
| 15 | Full Worker, shared, web, and two-browser verification; production-safe timer/reconnect/race hardening | Epic verification gate passes |

After a terminal result, the host can return every connected player to the same
lobby. The Room clears its persisted match, resets all ready states, and sends a
fresh authoritative lobby snapshot to each client.

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

For a deterministic local win, add `GAMEPLAY_TEST_ANSWER=CLASH` to
`apps/server/.dev.vars` before running `pnpm dev`. This binding is for local
verification only and must not be configured in deployed environments.
