# 02 · `<AppShell>` + route layout

**Status:** done

## What

The page shell every routed screen sits in — pulled out of the three screens
(which each inlined `<div class="app-stage"><div class="app-stage__inner">`) into
one component.

## Done

- `apps/web/src/ui/AppShell.tsx` — `<AppShell nav?>{children}</AppShell>`:
  - Root `<div>` with the radial-gradient ground + `--color-bg`, `min-height:
    100vh`, page padding (`--space-6`), `flex-direction: column`.
  - `nav` prop → renders `<nav class="nav">` (global Ember class) with a
    `<Link to="/" class="nav-brand">Wordle Clash</Link>`. **On for setup + lobby,
    off for title.**
  - `.stage` region (`flex: 1`, centred) wrapping a `.inner` column
    (`max-width: 480px`).
- `apps/web/src/ui/AppShell.module.scss` — single root `.app-shell`, `.stage` and
  `.inner` nested under it; Ember tokens only.
- `apps/web/src/styles/animations.css` — removed `.app-stage` / `.app-stage__inner`
  (moved into the component). Keyframes + `body` / `#root` / `a` base +
  reduced-motion guard stay.
- `TitleScreen` / `SetupScreen` / `LobbyScreen` now render
  `<AppShell>` / `<AppShell nav>` with their own root-class `<div>` as the single
  child; no more `app-stage` classes in the screens.

## Verification

- `pnpm --filter @wordle-clash/web build` passes.
- `/`, `/setup`, `/room/:code` all render; setup + lobby show the nav bar with a
  wordmark that links home, title does not.
- Content column stays centred (below the nav when present).
