# 04 · `<Field>` + `<Input>`

**Status:** done (pending review)

**Branch:** `feat/01-04-field-input` (stack layer 1)

## Done

- `apps/web/src/ui/Input.tsx` — `<Input>` over the Ember `.input` class. Pure
  class-mapper, no module. Defaults `type="text"`; `value`/`onChange`,
  `maxLength`, `placeholder`, `inputMode`, `autoCapitalize`, `disabled`, `aria-*`
  all pass through.
- `apps/web/src/ui/Field.tsx` (+ `Field.module.scss`) — `<Field label htmlFor
  hint? error?>` wraps a control: global `.field` for the label, plus an
  optional hint (`--color-neutral-500`) or error (`--color-danger-300`) line
  below. `error` wins over `hint`; the message gets an `id` (`<htmlFor>-error` /
  `-hint`) for `aria-describedby` wiring by consumers.
- `apps/web/src/ui/index.ts` — exports `Field`, `Input` (+ types).
- `/design-system` — new **Field / Input** section: name field, field with hint,
  field with error, disabled input.

## Verification

- `pnpm --filter @wordle-clash/web dev` → `http://localhost:5173/design-system`
  → Field / Input section: labels above `.input`s, hint line muted, error line in
  mahogany, disabled input dimmed. Focus an input → 2px aqua ring, aqua caret.
- `pnpm check` green.
