# 01 · web — Vite + React 19 + TS

**Status:** done

## Done

- Web application package — `@wordle-clash/web`, `type: module`.
- Deps: `react`/`react-dom` 19, `react-router` 8 (library mode), `zustand`,
  `partysocket`, `@phosphor-icons/react`, `@wordle-clash/shared` (`workspace:*`).
- Dev deps: `vite` 8, `@vitejs/plugin-react` 6, `sass-embedded` (SCSS —
  Vite built-in, no config), `typescript` 5.9, `vitest` 4.
- HTML entrypoint — `#root`, Inter via Google Fonts (`preconnect` + `display=swap`),
  `<title>Wordle Clash</title>`, `color-scheme: dark`.
- The React entrypoint uses `createRoot`, `StrictMode`, and `<RouterProvider>`,
  and loads Ember before global animations.
- **Styling convention:** each component with its own layout/spacing/typography
  imports an adjacent scoped CSS Module as `styles.x`, with
  a single kebab-case root class named after the component (`.title-screen`) on
  the outer element and all other rules nested under it (→ `styles.titleScreen`
  via `camelCaseOnly`). Ember utility classes (`.btn`, `.card`, …) stay global
  via `className`; no inline `style={{}}`. CSS Module types come from Vite's
  client declarations. The three placeholder screens follow this.
- Web TypeScript configuration extends the base, adds DOM libs, uses
  `jsx: react-jsx`, and aliases the shared workspace package.
- Vite uses `react()`; **no `base`**; `css.modules.localsConvention:
  'camelCaseOnly'`; `/api` + `/ws` proxy to the Worker (see story 06).

## Acceptance

- `pnpm --filter @wordle-clash/web dev` serves the app at `:5173`.
- `pnpm --filter @wordle-clash/web build` (tsc `--noEmit` + `vite build`) produces
  the deployable web bundle.
