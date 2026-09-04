# AGENTS.md

Conventions for working in this repo. **Non-negotiable — follow exactly.**
Rationale and detail: [`docs/architecture.md`](./docs/architecture.md).

---

## Operating rules

1. **Keep each pull request small:** target 600–800 changed lines of
   implementation code and keep every PR at 800 lines or less whenever
   practical. Split a Story into additional stacked layers before exceeding
   that limit. Generated files, lockfiles, migrations, and planning docs do not
   count as implementation code, but still keep them reviewable.
2. **Build vertical, UI-testable slices.** Plan each feature stack across every
   required layer—shared contract, backend/storage, client state, and frontend—
   so the completed stack produces a coherent feature the user can exercise in
   the browser. Do not end a feature stack at backend plumbing when a small UI
   integration can make it testable. Every stack plan and handoff must state the
   exact localhost UI flow used to verify the slice.
3. **Use the official `github/gh-stack` extension for stacked pull requests** —
   see [PR stacks](#pr-stacks) for the procedure. If `gh stack` is unavailable,
   prompt the user to install it with `gh extension install github/gh-stack`;
   do not install it without explicit authorization.
4. **Never embed raw SVG markup inline in JSX templates, HTML, or TypeScript.**
   Store SVG files under `apps/web/public/` and reference them by URL. When an
   icon must inherit the surrounding text color, reference the public SVG as a
   CSS mask and use `currentColor` for the mask background.
5. **Keep implementation updates concise and status-oriented.**
   Before starting a multi-step task, briefly list the work as bullets. As each
   bullet is completed, report its status briefly before moving to the next item.
   Do not paste verbose code-change summaries into chat unless the user explicitly
   asks for them.

---

## Planning docs — `docs/stories/`

- A **numbered folder** is an **Epic** (`docs/stories/00-app-scaffold/`).
- A **numbered file** inside it is a **Story / Task**
  (`docs/stories/00-app-scaffold/03-durable-object-partyserver.md`).
- Numeric prefixes set order. Keep them.
- Verification is **not** an epic — it's a gate on every epic. Reusable checklist:
  [`docs/verification.md`](./docs/verification.md); each epic README has its own
  "Verification" section; tests live in the epic that owns the code.

---

## Starting a story

When the user assigns a story, **before writing any code**:

1. Check the current branch — `git branch --show-current`.
2. **If on `main`**, create and switch to a new branch named with a Conventional
   Commit type prefix plus the epic/story numbers and the kebab-cased story name:
   ```
   git checkout -b <type>/<epic>-<story>-<story-name-kebab>
   ```
   - `<type>` — Conventional Commit type chosen from the story's nature:
     `feat` (default for a story), `fix`, `refactor`, `chore`, `docs`, `test`.
   - `<epic>` / `<story>` — the two-digit numbers from `docs/stories/`.
   - `<story-name-kebab>` — the story title, lower-case, hyphen-separated, no
     punctuation.
   - Example — Epic 01 / story 03 "Button / IconButton" →
     `feat/01-03-button-iconbutton`.
3. **If already on a story/feature branch**, stay on it — do not branch from a
   branch unless the user asks to stack (operating rule 2), in which case branch
   from the parent story's branch instead of `main`.
4. Creating this branch is the **only** git action taken automatically. Commits,
   pushes, and pull-request creation require the user's explicit authorization;
   rebases and merges stay with the user (see Workflow).

---

## PR stacks

When the user asks for **several dependent stories in one go**, ship them as a
stack of PRs with `gh stack` (github/gh-stack). Each layer is one story, named
per [Starting a story](#starting-a-story) (`feat/01-04-field-input`, …); the
bottom targets `main`, each layer above targets the one below.

Define the stack around a complete vertical slice before creating its branches.
The early layers may establish contracts or backend behavior, but the final
layer must expose the feature through the UI and document a browser-based
localhost verification flow. A backend-only stack is incomplete unless the user
explicitly scopes the work as infrastructure with no UI consumer.

**Prereqs**

- `gh stack --version` works; `gh auth status` is logged in.
- Local `main` is synced (`git checkout main && git pull --ff-only`).
- `git symbolic-ref refs/remotes/origin/HEAD` points at `refs/remotes/origin/main`.
  If not: `git remote set-head origin main` (gh-stack bases the first branch on
  this and fails if it's stale).

**Build it**

```sh
# 1. from a synced main — create the whole chain (bottom → top)
gh stack init feat/01-04-field-input feat/01-05-... feat/01-06-...

# 2. bottom layer
gh stack checkout feat/01-04-field-input
#    …implement the story…
pnpm check                       # keep every PR green — never commit a red layer
git add -A && git commit -m "feat(design-system): <story 04 summary>"

# 3. next layer up (repeat for each)
gh stack checkout feat/01-05-...
#    …implement, pnpm check, commit…

# 4. push every branch, then open/refresh the PR chain
gh stack push
gh stack submit
gh stack view
```

- Conventional Commit messages (`feat(scope): …`, `refactor: …`). One commit per
  layer is fine; keep the layer within operating-rule-1's size.
- `gh stack add <branch>` adds another layer on top of the current tip later.
- After the base or a lower layer changes: `gh stack sync` then `gh stack rebase`.

**Merging** (user does this): merge the **bottom** PR first, then
`gh stack sync && gh stack rebase` and merge the next, and so on — or
`gh stack merge` to merge the whole chain. Delete merged branches after.

---

## Styling — React + CSS

1. **SCSS Modules, always.** Every `.tsx` that has its own layout / spacing /
   typography imports an **adjacent `Name.module.scss`** and references
   `styles.x`. No exceptions for "just one rule".
2. **No inline `style={{}}`.** No `styled-components`, no Tailwind, no CSS-in-JS.
3. **One root class per module, named after the component file.** For
   `TitleScreen.tsx` the module's single root class is `.title-screen` (kebab-case
   of the file name), placed on the component's **outermost element**. **Every
   other rule in the module nests under it.**
   ```scss
   // TitleScreen.module.scss
   .title-screen {
     .kicker { … }
     .wordmark { … }
   }
   ```
   ```tsx
   // localsConvention is 'camelCaseOnly' (vite.config.ts)
   <div className={`app-stage ${styles.titleScreen}`}>
     <div className={styles.kicker}>…</div>
   ```
4. **Ember design-system classes stay global.** `.btn`, `.card`, `.tag`, `.seg`,
   `.field`, `.dialog`, … come from `apps/web/src/styles/ember.css` and are
   composed via plain `className` strings, alongside the module's `styles.x`.
   A pure class-mapper primitive (`<Button>` → `btn btn-primary`) needs no module.
5. **Tokens only.** All CSS — global or module — uses `--color-*` / `--space-*` /
   `--radius-*` / `--shadow-*`. **Never** a raw hex, px, or font-family name.
   Font sizes and spacing specifically must always come from the
   `--font-size-*` / `--space-*` variables in `apps/web/src/styles/ember.css`
   — never a hardcoded number for either, and never `rem`/`em`. Every unit in
   the codebase is `px` (including inside those token values themselves); if
   a design calls for a size ember.css doesn't define (e.g. "2.5x this token"),
   derive it from the token with `calc()` rather than writing a new raw number.
6. **The theme is Ember**, defined in `apps/web/src/styles/ember.css` — this file
   is ours to edit (retune the `:root` block). It replaced the design's original
   "Nocturne" theme; the component-class layer is inherited from it.
   Palette: `#171219` bg · `#84DCC6` accent (Pearl Aqua, = "correct" tile) ·
   `#F0803C` accent-2 (Pumpkin Spice, = "present") · `#95A3B3` neutral (Cool
   Steel) · `#B3001B` danger (Mahogany Red). Dark-only.
7. App shell (`.app-stage`, keyframes `tileFlip` / `joinIn` / `toastIn`) lives in
   `apps/web/src/styles/animations.css` — tokens only, same rules.
8. Separate CSS / SCSS rule blocks with one blank line. Stylelint enforces this;
   Prettier remains the formatter.
9. Named imports and exports with two or more specifiers use one specifier per
   line. ESLint Stylistic + `eslint-plugin-antfu` enforce and format JS / TS;
   Prettier formats the remaining file types.

---

## Architecture invariants

- **Monorepo:** pnpm workspaces (`apps/web`, `apps/server`, `packages/shared`,
  `e2e`). Cross-package deps use `workspace:*`; import `@wordle-clash/shared`
  TypeScript **source** directly (no build step).
- **The client⇄server contract is `packages/shared/src/protocol.ts`.** Any change
  to a WebSocket message shape happens there first; both sides compile against it.
- **Realtime = Cloudflare Durable Objects on our own account**, wrapped by the
  `partyserver` / `partysocket` libraries. This is **not** the hosted PartyKit
  service. One DO instance per room (`Room`, addressed by room code). The DO is
  the single authoritative owner of room state; the secret word and scoring never
  reach the client.
- **One Cloudflare Worker** serves the SPA assets **and** `/api/*` + `/ws/*`.
  One origin, one `wrangler deploy`.
- **Auth is guest-first and invisible.** No route or action ever requires an
  account. An anonymous identity is minted silently for socket auth + profile.
  Signing up is **purely additive** — it only unlocks leaderboard history, a
  saved avatar, and cross-device favorites. Guest favorites/history stay
  device-local until an account exists.
- **No guess dictionary, ever.** Any typed 5-letter string is a valid guess
  (deliberate — the competitive mode is meant to be chaotic). The only word list
  is the server-side ~2,300-word answer pool, introduced with the gameplay epics.
- **Gameplay is a later phase.** Current work is the foundation + title → setup →
  lobby screens. Rules: [`docs/game-rules.md`](./docs/game-rules.md).

---

## Database migrations

- **Drizzle + Cloudflare D1 (SQLite).** Generate with `pnpm db:generate`, apply
  with `pnpm db:migrate:local` / `pnpm db:migrate:remote` — `wrangler` owns the
  ledger; never hand-edit an applied migration.
- **Always pass `--name=`**, formatted
  `story_<epic>_<story>__<action>__<tables_or_group>` (matches `docs/stories/`):
  ```
  pnpm --filter @wordle-clash/server db:generate --name=story_03_01__create__auth_favorites_matches
  ```
- Use precise **actions**: `create`, `alter_add_column`, `rename`, `drop`,
  `backfill`. **Split unrelated actions into separate migrations.**
- Keep the generated `.sql` filename **≤ 55 chars** (drizzle's `NNNN_` prefix +
  name + `.sql`). Use exact table names when they fit; otherwise a concise domain
  group (e.g. `auth_core`).

---

## Workflow

- **`pnpm dev`** runs web (`:5173`) + Worker (`:8787`) in parallel;
  `pnpm dev:web` / `pnpm dev:server` for one side. Vite proxies `/api` + `/ws`.
- **Do not commit, push, or create/update pull requests unless the user explicitly
  authorizes those actions.** Authorization may cover a named branch or stack;
  do not extend it beyond the scope the user approved.
- **Do not merge, or run `git reset` / `restore` / `revert`, on the user's
  behalf.** Those operations stay with the user.
- **Do not run build / lint / test / typecheck commands unless the user asks.**
- Keep [`docs/architecture.md`](./docs/architecture.md),
  [`docs/verification.md`](./docs/verification.md), and the relevant
  `docs/stories/**` in step with any change that affects them.
