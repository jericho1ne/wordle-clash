# 01 · web — Vite + React 19 + TS

**Status:** done

## Done

- `apps/web` — `@wordle-clash/web`, `type: module`.
- Deps: `react`/`react-dom` 19, `react-router` 8 (library mode), `zustand`,
  `partysocket`, `@phosphor-icons/react`, `@wordle-clash/shared` (`workspace:*`).
- Dev deps: `vite` 8, `@vitejs/plugin-react` 6, `typescript` 5.9, `vitest` 4.
- `index.html` — `#root`, Inter via Google Fonts (`preconnect` + `display=swap`),
  `<title>Wordle Clash</title>`, `color-scheme: dark`.
- `src/main.tsx` — `createRoot` + `StrictMode` + `<RouterProvider>`; imports
  `styles/ember.css` then `styles/animations.css`.
- `tsconfig.json` — extends base, DOM libs, `jsx: react-jsx`, path alias for
  `@wordle-clash/shared` → its `src/index.ts`.
- `vite.config.ts` — `react()` only; **no `base`**; `/api` + `/ws` proxy to the
  Worker (see story 06).

## Acceptance

- `pnpm --filter @wordle-clash/web dev` serves the app at `:5173`.
- `pnpm --filter @wordle-clash/web build` (tsc `--noEmit` + `vite build`) produces
  `apps/web/dist`.
