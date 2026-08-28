# Story 07-00 — Gameplay & leaderboard plan

**Status:** done, pending review  
**Branch:** `docs/07-00-gameplay-leaderboard-plan`

## Goal

Turn the previously unplanned gameplay phase into ordered, reviewable PR layers
without bypassing its realtime and lobby dependencies.

## Decisions

- The Durable Object is authoritative for all gameplay and never sends the
  secret answer to clients before an allowed terminal reveal.
- Guesses must appear in the server-only Wordle allow-list; answers come from the smaller answer pool.
- Real-time winner selection is serialized in the Durable Object.
- Synchronous deadlines use persisted timestamps plus Durable Object alarms, not
  browser timers.
- Guest results stay local; D1 match-player persistence and leaderboard
  attribution are account-only at match time.
- Leaderboard ranking is wins, win rate, average guesses, display name, user ID.
- The undefined dance-off minigame is an explicit protocol/state boundary, not
  speculative game logic.

## Stack policy

Each implementation story is one `gh stack` layer. Every layer stays reviewable
and green before the next PR is submitted. The realtime and lobby prerequisites
are stacked before gameplay so no gameplay PR depends on scaffold stubs.
