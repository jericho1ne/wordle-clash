# 06 · `<Card>` + `<Tag>`

**Status:** done (pending review)

**Branch:** `feat/01-06-card-tag` (stack layer 3, on top of 01-05)

## Done

- `apps/web/src/ui/Card.tsx` — compound `<Card elevation={sm|md|lg}?>` over the
  Ember `.card` classes: `<Card.Kicker>`, `<Card.Title>`, `<Card.Body>`,
  `<Card.Meta>`. Pure class-mapper, no module.
- `apps/web/src/ui/Tag.tsx` — `<Tag tone={accent|accent-2|neutral|danger|outline}>`
  → `.tag` + `.tag-*` (default `neutral`). No module.
- `apps/web/src/ui/index.ts` — exports `Card`, `Tag` (+ `CardProps`, `TagProps`,
  `TagTone`).
- `/design-system` — **Card** section (all three elevations with kicker / title /
  body / meta) and **Tag** section (all five tones).

## Verification

- `http://localhost:5173/design-system` → Card: three surface cards, elevation
  `sm` = hairline edge, `md` adds an ambient shadow, `lg` a stronger one; kicker
  in aqua. Tag: accent (aqua-dark), accent-2 (pumpkin-dark), neutral (steel),
  danger (mahogany), outline (aqua border).
- `pnpm check` green.
