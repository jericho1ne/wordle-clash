# Epic 01 — Ember design system

**Status:** not started (the theme stylesheet + keyframes already landed early in epic 00).

**Ember** is the Wordle Clash design system. It replaces the design's original
vendored "Nocturne" theme: a warm, dark, high-contrast scheme —

| Token role | Colour | Also used for |
|---|---|---|
| `--color-bg` | `#171219` Coffee Bean | page ground |
| `--color-accent` | `#84DCC6` Pearl Aqua | buttons, links, focus, wordmark; the **correct** tile |
| `--color-accent-2` | `#F0803C` Pumpkin Spice | warm secondary; the **present** tile |
| `--color-neutral-*` | `#95A3B3` Cool Steel | surfaces, borders, muted text; the **absent** tile |
| `--color-danger-*` | `#B3001B` Mahogany Red | destructive actions, elimination, timer-low |

Each role carries a 100–900 ramp. The stylesheet
(`apps/web/src/styles/ember.css`) is **ours to edit** — retune the theme in its
`:root` block. The component layer (`.btn`, `.field`, `.seg`, `.card`, `.tag`,
`.dialog`, …) is inherited from Nocturne and retuned onto the Ember tokens.
Approach: build thin React primitives over the class names — no CSS modules, no
Tailwind. New CSS uses only `--color-*` / `--space-*` / `--radius-*` /
`--shadow-*`.

## Stories

| # | Story |
|---|---|
| 00 | `ember.css` (theme tokens + component layer) in `apps/web/src/styles/` (done in epic 00) |
| 01 | Inter `<link>` + `animations.css` keyframes `tileFlip` / `joinIn` / `toastIn` + app shell (done in epic 00); reduced-motion guard |
| 02 | `<AppShell>` / route layout with `.nav` + `.nav-brand` (setup/lobby only) |
| 03 | `<Button variant primary\|secondary\|ghost\|danger block?>` + `<IconButton>` (primary = accent outline, not fill) |
| 04 | `<Field>` + `<Input>` |
| 05 | `<SegmentedControl>` (`.seg`/`.seg-opt` over native radios) + `<RadioGroup>` |
| 06 | `<Card elevation>` + `Card.Kicker/.Title/.Body/.Meta` + `<Tag tone={accent\|accent-2\|neutral\|danger\|outline}>` |
| 07 | `<Dialog open onClose title>` (backdrop, focus trap, ESC, backdrop click) |
| 08 | `<ToastProvider>` + `useToast().show(text)` — one top-center pill, `toastIn`, ~2200ms, single-toast queue |
| 09 | `@phosphor-icons/react` set: ArrowRight, ArrowLeft/ArrowUUpLeft, Plus/DoorOpen, SignIn, Star (+ `weight="fill"`), Copy, Check |
| 10 | dev-only `/dev/kitchen-sink` route rendering every primitive |

## Verification

Baseline: [`../../verification.md`](../../verification.md) §0. Epic-specific:

- `/dev/kitchen-sink` renders every primitive in each variant/state; matches the
  Ember palette (aqua accent-outline buttons, mahogany `.btn-danger` fill,
  pumpkin `.tag-accent-2`, fading rules, 2px aqua `:focus-visible`, compact
  spacing).
- No primitive hard-codes a hex / px / font — all values come from `--color-*` /
  `--space-*` / `--radius-*` / `--shadow-*`.
- `tileFlip` / `joinIn` / `toastIn` play; nothing animates under
  `prefers-reduced-motion: reduce`.
- `useToast().show()` shows one top-center pill, auto-dismisses ~2.2s, a second
  call replaces (not stacks).
- Contrast: body text and the aqua accent both clear ≥ 4.5:1 on `--color-bg`;
  mahogany is only used as a fill with light text, never as a line.
