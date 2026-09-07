# 04 · Epic verification gate

**Status:** not started

## Scope

Not a code story — the epic-close checklist, run once 01–03 are done:

- `pnpm check` (typecheck + lint + test across the whole monorepo) is clean.
- Manual `wrangler dev` smoke test of every route in
  `00-hono-api-restructure-plan.md`'s route table, confirming status codes and
  bodies are unchanged from before the migration.
- A two-client realtime smoke test (per `docs/verification.md`) still works —
  the `/ws/*` restructure didn't break room connect/join.
- Update this epic's `README.md` status line and the `10-hono-api-restructure`
  row in `docs/stories/README.md`'s epic table to reflect the finished state.

## Testable outcome

`docs/stories/README.md` and this epic's `README.md` both read "done", and
the baseline checklist in `docs/verification.md` passes.
