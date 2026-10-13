# 04 · Epic verification gate

**Status:** not started

## Scope

Not a code story — the epic-close checklist, run once 01–03 are done:

- `pnpm check` (typecheck + lint + test across the whole monorepo) is clean.
- Manual `wrangler dev` smoke test of every route in the epic's route table,
  confirming status codes and
  bodies are unchanged from before the migration.
- A two-client realtime smoke test using the baseline verification checklist still works —
  the `/ws/*` restructure didn't break room connect/join.
- Update this epic's status line and the root epic table to reflect the finished state.

## Testable outcome

The root story index and this epic both read "done", and the baseline checklist
passes.
