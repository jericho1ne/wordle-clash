# 03 · `<Button>` + `<IconButton>`

**Status:** done (pending review)

**Branch:** `feat/01-03-button-iconbutton`

## What

Thin React wrappers over the Ember `.btn` classes — no CSS of their own because
they are pure class-mappers.

## Done

- `<Button variant block? leadingIcon? trailingIcon?>`:
  - `variant`: `primary` (default) | `secondary` | `ghost` | `danger` →
    `.btn-primary` / `-secondary` / `-ghost` / `-danger`.
  - `block` → `.btn-block`.
  - `leadingIcon` / `trailingIcon` slots (the `.btn` `gap` spaces them).
  - Defaults `type="button"`; `disabled`, `onClick`, `aria-*`, `className`, … pass
    through.
- `<IconButton variant aria-label>` →
  `.btn .btn-icon`; `aria-label` is **required** (icon-only needs a name);
  default variant `ghost`.
- Export both primitives from the design-system component surface.
- Add a dev-only
  showcase page (`/design-system`, `import.meta.env.DEV` only, stripped from prod).
  Order: **Palette first** (base colours as pills + the accent / accent-2 /
  neutral / danger 100–900 ramps — colours assigned via `data-swatch` attributes
  + generated SCSS rules, no inline styles), then **Button**, then
  **IconButton**. Grows one section per later design-system story (this is
  story 10's page, seeded early).
- Register the `/design-system` route.
- `TitleScreen` "Play" button → `<Button block>`; `SetupScreen` back arrow →
  `<IconButton aria-label="Back">`.

## Verification

- `pnpm --filter @wordle-clash/web dev`, then:
  - `http://localhost:5173/design-system` — Palette section first: base colour
    pills + four 100–900 ramps. Then Button: four variants (aqua-outline primary,
    bordered secondary, ghost, mahogany-fill danger), disabled row dims to ~45%,
    icon slots inline, block button full-width. Then IconButton: square 36px.
  - `/` — "Play" still works (now `<Button>`), navigates to `/setup`.
  - `/setup` — back `‹` still works (now `<IconButton>`), navigates to `/`.
  - Keyboard: Tab to a control → 2px aqua `:focus-visible` ring.
- `pnpm --filter @wordle-clash/web build` — `/design-system` absent from the prod
  bundle.
