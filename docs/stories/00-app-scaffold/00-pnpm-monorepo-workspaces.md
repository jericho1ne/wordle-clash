# 00 · pnpm monorepo + workspaces

**Status:** done

## Goal

A pnpm-workspaces monorepo with shared TS config, lint, and format, plus the
root script surface the other packages plug into.

## Done

- `pnpm-workspace.yaml` — `apps/*`, `packages/*`, `e2e`.
- Root `package.json` — `private`, `type: module`, `packageManager: pnpm@10.25.0`,
  `engines.node >= 22`, and root scripts: `dev`, `build`, `typecheck`, `lint`,
  `format`, `format:check`, `test`, `db:generate`, `db:migrate:local`,
  `db:migrate:remote`, `deploy`.
- `tsconfig.base.json` — strict, `moduleResolution: bundler`,
  `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `isolatedModules`.
- `eslint.config.js` — flat config: `@eslint/js` + `typescript-eslint` +
  `eslint-plugin-react-hooks` / `react-refresh` (web only), `consistent-type-imports`.
- `.prettierrc.json` + `.prettierignore` (ignores generated migrations), with
  semicolon-free JavaScript / TypeScript formatting.
- `stylelint.config.mjs` enforces one blank line between CSS / SCSS rule blocks;
  `pnpm lint` runs Stylelint after ESLint.
- `.vscode/settings.json` makes Cursor / VS Code format on save with the
  workspace Prettier configuration and apply Stylelint fixes.
- `.gitignore`; Node pin `22` in both `.nvmrc` (nvm) and `.node-version`
  (fnm / nodenv / asdf / CI `node-version-file`).

## Acceptance

- `pnpm install` resolves all three workspace packages.
- `pnpm lint` / `pnpm format:check` run (no files failing).
