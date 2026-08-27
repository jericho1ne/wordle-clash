# Wordle Clash — Architecture

This is the single source of truth for the project's architectural choices. It
covers the whole product; the current build (Phase 1) implements the foundation
plus the title → setup → lobby screens. Gameplay is deferred (see
[Out of scope](#out-of-scope-for-phase-1)).

The approved phase plan lives at `~/.claude/plans/hi-i-have-a-sunny-rossum.md`;
per-epic/story breakdown is under [`docs/stories/`](./stories/).

---

## Product in one paragraph

A multiplayer (2–8 player) Wordle race. Players create or join a room by code,
pick a mode in the lobby, and race to guess the word. Two modes: **Synchronous**
(5 tries; everyone submits within a minute, all guesses reveal together; a
simultaneous-correct tie triggers a "bboy dance-off" mini-game) and **Real-time**
(10 tries; first to solve wins — deliberately chaotic). Playing needs no account;
signing up is optional and only unlocks a leaderboard, a saved avatar, and saved
room codes.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Client | **React 19** SPA, **Vite**, **TypeScript** | All UI and animation in React. No SSR. |
| Routing | **React Router** (library/SPA mode) | `/`, `/setup`, `/room/:code`. Worker SPA fallback serves deep links. |
| Client state | **Zustand** (thin) | One room store. Expand only if it earns its keep. |
| Realtime transport | **WebSockets** | Full-duplex. Server pushes fully-formed domain events ("fat events"), not "something changed" pings. |
| Realtime runtime | **Cloudflare Durable Objects**, one per room, via the **`partyserver`** library (client: **`partysocket`**) | Our own Cloudflare account. `partyserver` is an MIT library that wraps the DO **WebSocket hibernation** API — **not** the hosted PartyKit service, no third-party bill. Swapping to the raw DO API is a contained change inside `Room.ts`. |
| Backend | **Cloudflare Worker** (TypeScript), **Hono** router | The same Worker also serves the built SPA assets. |
| Database | **Cloudflare D1** (SQLite) + **Drizzle ORM** | `drizzle-kit generate` → `wrangler d1 migrations apply`. Accounts, favorites, and (Phase 1: inert) match history. |
| Auth | **better-auth** — `anonymous` plugin now, `emailOTP` / OAuth later | Guest-first and invisible. |
| Hosting | **Cloudflare**, single `wrangler deploy` | Assets + Worker + Durable Object + D1 in one deploy. (Supersedes an earlier Netlify/Vercel idea.) |
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
There is **no guess dictionary anywhere** — any typed 5-letter string is a valid
guess (a deliberate design choice: the competitive mode is meant to be chaotic,
and junk-probing is a legitimate strategy). The only word list is the ~2,300-word
**answer pool**, which stays server-side and is only introduced with the gameplay
epics.

### Guest-first, invisible identity
First visit silently mints an anonymous identity (better-auth `anonymous`
plugin). It is plumbing — a signed token for socket auth plus the player's
name/avatar — never surfaced as "an account", and there is no login step in the
title → setup → lobby flow. **No route or action ever requires an account.**

Signing up is **purely additive**. The only things an account unlocks:
- leaderboard-eligible match history (attributed to a real identity),
- a saved avatar,
- saved room codes (favorites) that sync across devices.

For guests, favorites and match history stay device-local (`localStorage`) and
only sync to D1 once an account exists. "Link an email / OAuth provider" is a
later optional upsell surface (e.g. after a match), not part of Phase 1.

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
  package.json          — root: shared tooling (eslint, prettier, tsc) + fan-out scripts
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

## Client ⇄ server protocol (summary)

WebSocket frames are `{ t: <type>, ... }`, zod-validated on receipt.

- **Client → server:** `setReady`, `setGameMode` (host), `updateProfile`,
  `startMatch` (host), `leave`, `ping`.
- **Server → client:** `roomState` (full snapshot; on connect and every
  reconnect), `playerJoined`, `playerLeft`, `playerUpdated`, `gameModeChanged`,
  `hostChanged`, `matchStarting`, `error`, `pong`.

Optimistic client updates (e.g. ready toggle) are reconciled by the authoritative
`playerUpdated` / `roomState` that follows. Full types:
`packages/shared/src/protocol.ts`.

---

## Local development

```
pnpm install
pnpm --filter @wordle-clash/server db:migrate:local   # once tables exist (epic 03)
# terminal 1:
pnpm --filter @wordle-clash/server dev                 # wrangler dev  -> :8787
# terminal 2:
pnpm --filter @wordle-clash/web dev                    # vite          -> :5173
```

The Vite dev server proxies `/api` and `/ws` to the Worker, so the browser only
talks to `http://localhost:5173`. Adopting `@cloudflare/vite-plugin` for a
single-process dev server is a possible later optimization.

Production: `pnpm build` then `pnpm --filter @wordle-clash/server deploy`.

The full checklist — baseline commands, the two-client realtime test, per-suite
commands, deploy check — is [`verification.md`](./verification.md). It is run
after every epic; verification is a gate on each epic, not a separate one.

---

## Known risks / watch items

- **better-auth on Workers** is not yet verified against our exact versions +
  custom fields in `workerd`. Mitigation: timebox the integration; fallback is a
  small HMAC-signed-cookie guest identity using the **same table names**, so
  better-auth drops in later with no data migration.
- **Room lifecycle edge cases:** reserved-but-never-joined rooms (short alarm
  cleanup), empty-room grace period, multiple tabs = one player, host
  reassignment on host disconnect, joiner arriving after `phase === 'starting'`.
- **DO hibernation:** in-memory room state must always be rehydrated from storage
  on wake; every mutation persists before it broadcasts.

---

## Out of scope for Phase 1

Wordle gameplay itself: the guess board, the synchronous round (1-minute timer +
simultaneous reveal), the real-time race, win/tie resolution, the bboy dance-off
tie-break, the `/room/:code/play` route (which will replace the "Match starting"
dialog), the server-side answer list, `recordMatchResult()`, and the leaderboard
UI.

The gameplay rules are captured in [`game-rules.md`](./game-rules.md) (the
dance-off tap/rhythm minigame rules are still forthcoming). These become their
own epics. The Phase 1 architecture is deliberately shaped so they only add game
logic on top of a proven realtime + identity substrate — notably: the `Room`
Durable Object already owns authoritative state and will additionally hold the
secret word / guesses / scores / round + timer state; the `matchStarting` event
has a marked handoff point; the message protocol is a versioned discriminated
union ready for `guess` / `guessResult` / `roundClosed` / `danceOff*` frames.
