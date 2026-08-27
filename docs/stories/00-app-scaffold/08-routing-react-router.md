# 08 · routing (React Router)

**Status:** done

## Decision

`react-router` v8, **library / SPA mode** (`createBrowserRouter` +
`<RouterProvider>`), not framework mode — keeps the app a pure client SPA served
by the Worker's `single-page-application` asset fallback, no SSR to reconcile.
(The plan said "v7"; v8 is current with the same library-mode API.)

## Done

- `src/router.tsx` — routes:
  - `/` → `TitleScreen`
  - `/setup` → `SetupScreen` (reads `?join=<code>`)
  - `/room/:code` → `LobbyScreen`
  - `*` → `<Navigate to="/" replace />`
- Placeholder screen components under `src/features/{title,setup,lobby}/`, each
  rendering the `.app-stage` shell with a "scaffold placeholder" note and the
  Ember classes they'll build on.
- `LobbyScreen` normalizes `:code` via `normalizeRoomCode` from the shared
  package (smoke test that the workspace dep resolves at runtime).

## Not in this story

- The `/room/:code` deep-link guard (redirect to `/setup?join=<code>` when no
  profile) → epic 06-lobby-screen/00.
- Canonical-form redirect for non-normalized codes → epic 06.
- `<AppShell>` with `.nav` for setup/lobby → epic 01-design-system/02.

## Acceptance

- Navigating between `/`, `/setup`, `/room/TEST-1234` works; unknown paths
  redirect to `/`.
