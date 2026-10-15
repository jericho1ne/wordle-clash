# 09 · CI build + deploy

**Status:** not started

## Goal

Build and deploy from GitHub Actions instead of a developer machine, so every
production deploy comes from a reviewed `main` commit with a known environment.
Today `pnpm deploy:prod` runs locally (see
[`docs/deployment.md`](../../deployment.md)).

## Plan

- Add `.github/workflows/deploy.yml`, triggered on push to `main` and on
  `workflow_dispatch`. It runs only after the `verify` job in `ci.yml` passes
  (`workflow_run` or a reusable `verify` workflow).
- Steps: checkout, pnpm + Node setup, npm auth for `@lowtyde/*` (same
  `~/.npmrc` step as `ci.yml`), `pnpm install --frozen-lockfile`,
  `pnpm db:migrate:remote`, then `pnpm deploy:prod`.
- Repo secrets/variables:
  - `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (secrets; deploy
    credentials, never in `apps/server/.env`).
  - `LOWTYDE_NPM_TOKEN` (secret; npm read token for the private
    `@lowtyde/analytics` package).
  - `VITE_GTM_ID` (plain variable, not a secret; it is public and inlined by
    Vite at build time, so it must exist in the build step's env).
- Use a GitHub `production` environment with a concurrency group so deploys do
  not overlap; optionally require approval.
- Remote D1 migrations run before the Worker deploy; a failed migration stops
  the deploy.

## Decisions to make

- Deploy on every push to `main`, or only on a release tag / manual dispatch.
- Whether migrations run automatically in CI or stay a manual step.
- Preview deploys on PRs (see the follow-up in [07 · CI](./07-ci.md)).

## Not in this story

- Staging environment or blue/green rollout.
- Changing how local development works (`pnpm dev` stays as is).

## Verification

- Merging to `main` (or dispatching the workflow) deploys with no local steps.
- The deployed site loads GTM (`window.dataLayer` has `gtm.js`) and passes the
  smoke tests in [`docs/deployment.md`](../../deployment.md) §1.
- A failing `verify` or migration blocks the deploy.
