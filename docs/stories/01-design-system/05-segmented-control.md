# 05 · `<SegmentedControl>` + `<RadioGroup>`

**Status:** done (pending review)

**Branch:** `feat/01-05-segmented-control` (stack layer 2, on top of 01-04)

## Done

- `<SegmentedControl name options value
  onChange aria-label?>`. Generic over the option value type (`T extends
  string`). Renders `.seg` + `.seg-opt` `<label>`s over native radios (keyboard +
  form semantics free). Optional per-option `icon`. Pure class-mapper, no module.
- `<RadioGroup>` uses the same generic
  controlled API; `.radio` + `.dot` rows. The module only stacks the rows
  vertically (`.radio-group`).
- Export both controls and their option types from the design-system component surface.
- `/design-system` — **SegmentedControl** and **RadioGroup** sections, each a
  controlled example with a "selected: …" readout (`DesignSystem` now holds
  `useState`).

## Verification

- `http://localhost:5173/design-system` → SegmentedControl: two options, the
  checked one shows the aqua inset ring + aqua text; clicking updates "selected".
  RadioGroup: stacked rows, checked dot fills aqua; keyboard arrow keys move
  between options in each group.
- `pnpm check` green.
