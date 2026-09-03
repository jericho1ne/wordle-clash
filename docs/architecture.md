# Wordle Clash — Architecture

This is the single source of truth for the project's architectural choices. It
covers the whole product; the current build implements the foundation plus the
title → setup → lobby → gameplay flow. Match history and the leaderboard remain
deferred (see [Out of scope](#out-of-scope-for-phase-1)).

The approved phase plan lives at `~/.claude/plans/hi-i-have-a-sunny-rossum.md`;
per-epic/story breakdown is under [`docs/stories/`](./stories/).

---

## Product in one paragraph

A multiplayer (2–8 player) Wordle race. Players create or join a room by code,
pick a mode in the lobby, and race to guess the word. Two modes: **Synchronous**
(5 tries; the host selects a 1-, 3-, or 5-minute round limit and all guesses reveal together; a
simultaneous-correct tie triggers a "bboy dance-off" mini-game) and **Real-time**
(10 tries; first to solve wins — deliberately chaotic). Playing needs no account;
signing up is optional and only unlocks a leaderboard, a saved avatar, and saved
room codes.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Client | **React 19** SPA, **Vite**, **TypeScript** | All UI and animation in React. No SSR. |
| Design system | **Ember** — hand-owned CSS (`apps/web/src/styles/ember.css`) | Warm dark theme; see [Design system](#design-system-ember). Global utility classes + per-component `*.module.scss`. No Tailwind. |
| Routing | **React Router** (library/SPA mode) | `/`, `/setup`, `/room/:code`. Worker SPA fallback serves deep links. |
| Client state | **Zustand** (thin) | One room store. Expand only if it earns its keep. |
| Realtime transport | **WebSockets** | Full-duplex. Server pushes fully-formed domain events ("fat events"), not "something changed" pings. |
| Realtime runtime | **Cloudflare Durable Objects**, one per room, via the **`partyserver`** library (client: **`partysocket`**) | Our own Cloudflare account. `partyserver` is an MIT library that wraps the DO **WebSocket hibernation** API — **not** the hosted PartyKit service, no third-party bill. Swapping to the raw DO API is a contained change inside `Room.ts`. |
| Backend | **Cloudflare Worker** (TypeScript), **Hono** router | The same Worker also serves the built SPA assets. |
| Database | **Cloudflare D1** (SQLite) + **Drizzle ORM** | `drizzle-kit generate` → `wrangler d1 migrations apply`. Accounts, favorites, and (Phase 1: inert) match history. |
| Auth | **better-auth** — anonymous, username/password; `emailOTP` / OAuth later | Guest-first and invisible. |
| Hosting | **Cloudflare**, single `wrangler deploy` | Assets + Worker + Durable Object + D1 in one deploy. (Supersedes an earlier Netlify/Vercel idea.) Runbook + custom domain: [`deployment.md`](./deployment.md). |
| Package layout | **pnpm workspaces** monorepo, no Turborepo yet | `apps/web`, `apps/server`, `packages/shared`, `e2e`. |

---

## Why these choices

### Durable Objects for authoritative room state
A "first correct guess wins" race must be decided **server-side** by true message
arrival order — client timestamps and network latency cannot be trusted. A
Durable Object is a single-threaded, single-instance actor: perfect for one
room's authoritative state (players, and later the secret word, guesses, scores,
timers, round progression). It holds state in memory for speed, persists to its
own storage for crash/hibernation safety, and broadcasts events to all sockets in
the room in one tick. No separate realtime service, no database in the hot path.

### `partyserver` / `partysocket` as a thin layer, not a platform
They give us a class-based room API (`onConnect` / `onMessage` / `onClose` /
`broadcast` / `getConnections`) and a client with reconnect + send-buffering
built in, both running on **our** Durable Objects with **our** `wrangler deploy`.
No hosted PartyKit dependency. If the library ever becomes a liability, the raw
`ctx.acceptWebSocket` hibernation API is a localized swap in `apps/server/src/rooms/Room.ts`
with no protocol or client change.

### Fat events over the socket
The server turns an action into a fully-formed domain event
(`{ t: 'playerJoined', player: {...} }`, later
`{ t: 'guessResult', tiles: [...], scores: {...} }`) and broadcasts it. Clients
apply events directly — no follow-up GET. On connect/reconnect the server sends a
full `roomState` snapshot so a client can always resync. The message contract is
a zod-validated discriminated union in `packages/shared/src/protocol.ts`.

### The secret word never reaches the client
Guess validation and answer selection remain server-side. The Worker bundles a
Wordle allow-list for submitted guesses plus a smaller answer pool; neither list
ships in the SPA. The Durable Object normalizes and validates each guess before
evaluating or persisting it.

### Guest-first, invisible identity
First visit silently mints an anonymous identity (better-auth `anonymous`
plugin). It is plumbing — a signed token for socket auth plus the player's
name, avatar color, and animal — never surfaced as "an account", and there is no login step in the
title → setup → lobby flow. **No route or action ever requires an account.**

Signing up is **purely additive**. Users can create an account with a username,
email, and password; email verification and recovery mail remain deferred until
an email delivery service is added. The only things an account unlocks:
- leaderboard-eligible match history (attributed to a real identity),
- a saved avatar,
- saved room codes (favorites) that sync across devices.

For guests, favorites and match history stay device-local (`localStorage`) and
only sync to D1 once an account exists. "Link an email / OAuth provider" is a
later optional upsell surface (e.g. after a match), not part of Phase 1.

`/api/favorites` is account-only at the Worker boundary: `GET` lists codes,
`PUT` / `DELETE` toggle one code, and `POST` performs the one-time merge of guest
codes during account linking. Anonymous clients use `wc.favorites` and never call
that API.

### Single Worker serves the SPA
Cloudflare's current guidance is "Workers, not Pages". One Worker with an
`assets` binding (`not_found_handling: "single-page-application"`) serves the
built SPA and handles `/api/*` + `/ws/*`. One origin → no CORS, no cross-origin
cookie or WebSocket friction, one deploy.

### WebSocket auth via a short-lived ticket, not cookies
Cookies on WS upgrade requests are fragile across proxies/clients. Instead:
`POST /api/rt/ticket` (cookie-authed) mints a ~60s signed JWT; the client passes
it as a `partysocket` query param; the Worker verifies it at the upgrade
boundary, strips it, and injects trusted `x-user-*` headers before forwarding to
the Durable Object. DOs are not publicly addressable, so the DO trusts those
headers. Reconnects fetch a fresh ticket. This keeps auth entirely at the Worker
edge and out of the hibernating DO.

---

## Repository layout

This is a **pnpm workspaces monorepo**: one repo, one `pnpm install`, several
independently-scoped packages that can depend on each other.

```
wordle-clash/
  pnpm-workspace.yaml   — workspace globs: apps/*, packages/*, e2e
  package.json          — root: shared tooling (eslint, stylelint, prettier, tsc) + fan-out scripts
  tsconfig.base.json    — the strict config every package extends
  apps/
    web/       @wordle-clash/web     — DEPLOYABLE: Vite + React 19 SPA
    server/    @wordle-clash/server  — DEPLOYABLE: Cloudflare Worker + `Room` Durable Object
  packages/
    shared/    @wordle-clash/shared  — LIBRARY (imported, not deployed): protocol types,
                                       room types, room-code, game-modes, avatars (zod-only dep)
  e2e/         @wordle-clash/e2e     — Playwright end-to-end tests
  docs/
    architecture.md                 — this file
    game-rules.md                   — gameplay rules (later phases)
    stories/<NN-epic>/<NN-story>.md  — epic = folder, story/task = file
```

**`apps/` vs `packages/`** is convention, not enforcement: `apps/` holds things
you deploy or run, `packages/` holds libraries the apps consume. pnpm treats them
all the same.

**How they link.** Both apps declare `"@wordle-clash/shared": "workspace:*"`. The
`workspace:*` protocol tells pnpm to symlink the local package instead of
fetching from npm, so `import { normalizeRoomCode } from '@wordle-clash/shared'`
resolves straight to `packages/shared/src/`. The apps import its **TypeScript
source directly** (Vite and wrangler/esbuild transpile it) — no build or publish
step, and edits to shared code are instantly live in both apps.

**Why a shared package at all.** The client and server must agree on the exact
shape of every WebSocket frame. Keeping that contract (`protocol.ts`) plus pure
logic (`room-code.ts`, `game-modes.ts`) in one place means the type checker
catches any drift between the two sides at compile time, and unit tests cover the
logic once.

**Script fan-out.** Root scripts orchestrate the packages: `pnpm -r typecheck`
runs `typecheck` in every package; `pnpm --filter @wordle-clash/web <script>`
targets one; `pnpm build` builds `shared` then `web` in order.

---

## Design system (Ember)

**Ember** is the Wordle Clash theme. It replaces "Nocturne", the mono blurple
theme that shipped with the imported design — a deliberate switch to a warm,
dark, higher-contrast, multi-hue palette that suits a word-race game.

| Token | Colour | Role |
|---|---|---|
| `--color-bg` | `#171219` Coffee Bean | near-black warm ground |
| `--color-accent` | `#84DCC6` Pearl Aqua | buttons, links, focus, wordmark — **and the "correct" tile** |
| `--color-accent-2` | `#F0803C` Pumpkin Spice | warm secondary — **and the "present" tile** |
| `--color-neutral-*` | `#95A3B3` Cool Steel | surfaces, borders, muted text — **and the "absent" tile** |
| `--color-danger-*` | `#B3001B` Mahogany Red | destructive actions, elimination, timer-low (fill only — too dark for a line) |
| `--color-text` | `#F2ECE9` | warm off-white |

- **One stylesheet, hand-owned.** `apps/web/src/styles/ember.css` holds the token
  `:root` block plus the component layer (`.btn` incl. `.btn-danger`, `.field`,
  `.input`, `.seg`, `.radio`, `.card`, `.tag`, `.nav`, `.table`, `.dialog`,
  `.hr`). It is imported once in `main.tsx`. The component layer is inherited
  from Nocturne and retuned onto the Ember tokens. Edit the `:root` block to
  retune the theme — unlike the original vendored Nocturne file, this one is ours.
- **Two styling layers, no Tailwind.**
  1. **Global** — the Ember utility classes above (`.btn`, `.card`, `.tag`, …)
     and the app shell (`animations.css`: the `tileFlip` / `joinIn` / `toastIn`
     keyframes + `.app-stage`). Composed via `className` strings.
  2. **Per-component** — every `.tsx` that needs its own layout / spacing /
     typography imports an **adjacent `Name.module.scss`** (CSS Modules, scoped)
     and references `styles.x`. No inline `style={{}}` objects, no ad-hoc CSS.
     Each module has **one kebab-case root class matching the component**
     (`.title-screen`, `.lobby-screen`), applied to the component's outermost
     element, and **every other rule nests under it** — so the module is
     self-namespacing and greppable. `src/ui/` primitives that are pure
     class-mappers (a `<Button>` that only picks `btn btn-primary`) may skip the
     module; any custom CSS goes in one.
  All CSS — global or module — uses only `--color-*` / `--space-*` /
  `--radius-*` / `--shadow-*`, never raw hex/px/font. SCSS via `sass-embedded`
  (Vite built-in); `vite.config.ts` sets `css.modules.localsConvention:
  'camelCaseOnly'` so `.title-screen` is referenced as `styles.titleScreen`;
  `*.module.scss` typing comes from `vite/client`.
- **Dark only.** No light theme. Each role carries a 100–900 ramp on one shared
  lightness scale; dark steps (700–900) for fills/hovers/borders, 500 as the
  base, light steps (100–300) for text on tints.
- **Type & metrics** unchanged from the source: Inter (medium-weight headings),
  compact 0.7× spacing scale, 4/8/14px radii, edge-plus-ambient shadows.
- Icons: Phosphor (`@phosphor-icons/react`).

Details and the primitive-by-primitive plan:
[`stories/01-design-system/`](./stories/01-design-system/).

---

## Client ⇄ server protocol (summary)

WebSocket frames are `{ t: <type>, ... }`, zod-validated on receipt.

- **Client → server:** `setReady`, `setGameMode` (host), `updateProfile`,
  `startMatch` (host), `submitGuess`, `returnToLobby` (host), `leave`, `ping`.
- **Server → client:** `roomState` (full snapshot; on connect and every
  reconnect), `playerJoined`, `playerLeft`, `playerUpdated`, `gameModeChanged`,
  `hostChanged`, `matchStarting`, `matchState`, `guessAccepted`, `error`, `pong`.

Optimistic client updates (e.g. ready toggle) are reconciled by the authoritative
`playerUpdated` / `roomState` that follows. Full types:
`packages/shared/src/protocol.ts`.

---

## Local development

```
pnpm install
pnpm --filter @wordle-clash/server db:migrate:local   # once tables exist (epic 03)
pnpm dev                                              # vite :5173 + wrangler dev :8787, in parallel
```

`pnpm dev` = `pnpm --filter "./apps/*" --parallel --no-bail run dev`. Output is
prefixed per package; `--no-bail` keeps one side alive if the other crashes. Run
a single side with `pnpm dev:web` / `pnpm dev:server`. The server `dev` script
pre-creates `apps/web/dist` so `wrangler dev` doesn't error on the deploy-only
`assets` binding before a build has run.

The Vite dev server proxies `/api` and `/ws` to the Worker, so the browser only
talks to `http://localhost:5173`. Adopting `@cloudflare/vite-plugin` for a true
single-process dev server is a possible later optimization.

Production: `pnpm build` then `pnpm --filter @wordle-clash/server deploy`. Full
runbook (one-time prereqs, `wordleclash.com` custom domain): [`deployment.md`](./deployment.md).

The full checklist — baseline commands, the two-client realtime test, per-suite
commands, deploy check — is [`verification.md`](./verification.md). It is run
after every epic; verification is a gate on each epic, not a separate one.

---

## Known risks / watch items

- **better-auth on Workers:** stable 1.7.2 with the anonymous plugin, Drizzle D1
  adapter, and custom profile fields is verified locally in `workerd`. Production
  deployment remains a gate. If a production-only incompatibility appears, the
  fallback remains a small HMAC-signed-cookie guest identity using the **same
  table names**.
- **Room lifecycle edge cases:** reserved-but-never-joined rooms (short alarm
  cleanup), empty-room grace period, multiple tabs = one player, host
  reassignment on host disconnect, joiner arriving after `phase === 'starting'`.
- **DO hibernation:** in-memory room state must always be rehydrated from storage
  on wake; every mutation persists before it broadcasts.
- **Connection liveness:** clients send JSON heartbeats every 15 seconds.
  Cloudflare answers and timestamps them without waking the hibernating Room;
  the Room removes half-open connections after 90 seconds. Clean disconnects
  retain the shorter 30-second reconnect grace.

---

## Out of scope for Phase 1

Account-owned match-history persistence and the leaderboard API and UI
remain deferred.

The gameplay rules are captured in [`game-rules.md`](./game-rules.md), with its
implementation tracked in
[`docs/stories/07-gameplay-leaderboard`](./docs/stories/07-gameplay-leaderboard/).
The `Room` Durable Object owns the secret word, guesses, round timer, winner
selection, and terminal state. Its public snapshots contain only renderable
guesses and never expose the answer during active play.

The bboy dance-off minigame that resolves a synchronous-round tie is
implemented in
[`docs/stories/08-beatmap-engine`](./docs/stories/08-beatmap-engine/) (the
offline kick/snare beat map generator) and
[`docs/stories/09-tiebreaker-battle`](./docs/stories/09-tiebreaker-battle/)
(the DDR-style battle itself, at `/room/:code/tiebreaker`) — see that epic's
README for the current verification status.
