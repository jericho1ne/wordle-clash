# 00 · pnpm monorepo + workspaces

**Status:** done

## Goal

A pnpm-workspaces monorepo with shared TypeScript configuration, lint, and format, plus the
root script surface the other packages plug into.

## Done

- Workspaces for applications, shared packages, and end-to-end tests.
- Root package metadata — `private`, `type: module`, `packageManager: pnpm@10.25.0`,
  `engines.node >= 22`, and root scripts: `dev`, `build`, `typecheck`, `lint`,
  `format`, `format:check`, `test`, `db:generate`, `db:migrate:local`,
  `db:migrate:remote`, `deploy`.
- Shared TypeScript configuration — strict, `moduleResolution: bundler`,
  `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `isolatedModules`.
- Flat ESLint configuration: `@eslint/js` + `typescript-eslint` +
  `eslint-plugin-react-hooks` / `react-refresh` (web only), `consistent-type-imports`.
- Prettier configuration that ignores generated migrations.
- ESLint Stylistic formats JavaScript / TypeScript without semicolons;
  `eslint-plugin-antfu` keeps multiline named import / export lists consistent,
  with two or more specifiers forced to one per line.
- Stylelint enforces one blank line between CSS / SCSS rule blocks;
  `pnpm lint` runs Stylelint after ESLint.
- Workspace editor settings make Cursor / VS Code format JavaScript / TypeScript
  with ESLint and other supported files with Prettier, then applies Stylelint
  fixes to CSS / SCSS.
- Git ignore rules and Node 22 pins for nvm and version-aware tooling
  (fnm / nodenv / asdf / CI `node-version-file`).

## Acceptance

- `pnpm install` resolves all three workspace packages.
- `pnpm lint` / `pnpm format:check` run (no files failing).
