# Verification

Run this after **every** epic, plus the epic-specific checks in that epic's
`docs/stories/<epic>/README.md` → "Verification" section.

Nothing here is a separate epic — verification is a gate on each one.

---

## 0. Baseline (every epic)

```sh
pnpm install                 # clean resolve
pnpm -r typecheck            # tsc --noEmit across web, server, shared
pnpm lint                    # eslint + Stylelint (including CSS/SCSS block spacing)
pnpm format:check            # ESLint Stylistic (JS/TS) + Prettier (other files)
pnpm -r test                 # vitest across all packages
pnpm --filter @wordle-clash/web build   # tsc + vite build -> apps/web/dist
```

All six must pass. CI (`.github/workflows/ci.yml`) runs the same set.

---

## 1. Run it locally

```sh
pnpm dev        # web + Worker in parallel (vite :5173, wrangler dev :8787)
```

`pnpm dev` runs `pnpm --filter "./apps/*" --parallel --no-bail run dev`, with
each side's output prefixed (`apps/web dev:` / `apps/server dev:`). Run one side
alone with `pnpm dev:web` or `pnpm dev:server`. The server `dev` script
pre-creates `apps/web/dist` so `wrangler dev` doesn't choke on the (deploy-only)
`assets` binding before a build has run.

Open **http://localhost:5173**. Vite proxies `/api` and `/ws` to the Worker, so
the browser only ever talks to `:5173`.

First-time / after schema changes (once D1 tables exist, epic 03):

```sh
pnpm --filter @wordle-clash/server db:migrate:local
```

The Worker needs `apps/web/dist` to exist for its `assets` binding — run
`pnpm --filter @wordle-clash/web build` once, or ignore the warning if you're only
testing `/api` + `/ws`.

Smoke checks:

```sh
curl http://localhost:8787/api/health          # -> {"ok":true,...}
```

---

## 2. Two-client realtime test (from epic 02 onward)

The core multiplayer behaviour. Use two browser profiles (or a normal window +
an incognito window) so they get distinct identities.

1. **Client A:** `/` → Play → set name + avatar → **Create room** → lands in
   `/room/<CODE>`, shown as HOST, "Players · 1".
2. **Client B:** open the same `/room/<CODE>` URL → routed via
   `/setup?join=<CODE>` → set name → lands in the lobby.
3. Within ~1s both clients show **2 players**; B's row animates in (`joinIn`);
   A sees a toast "<B> joined the lobby".
4. Toggle **Ready** on each → the other client updates live.
5. Host (A) changes **game mode** → B sees the new description; B cannot change it.
6. Close Client A → after the grace period, B is promoted to **HOST**.
7. Re-open, both ready, 2 players → host **Start game** → both clients enter
   `/room/<CODE>/play` and show the same match.
8. **Copy** the room code → it's on the clipboard. **Favorite** (star) → toast;
   reload → the star state persists (localStorage for guests).
9. Kill the Worker mid-session → clients show "reconnecting"; restart it →
   clients recover and re-sync from a fresh `roomState` snapshot.
10. In Network → Socket → Messages, confirm the client sends `{"t":"ping"}`
    about every 15 seconds and receives `{"t":"pong"}`. Closing a player's
    final tab marks them disconnected, then removes them after the 30-second
    reconnect grace. A silent half-open socket is removed by the 90-second
    heartbeat sweep.

Gameplay smoke test (Epic 07 onward): set `GAMEPLAY_TEST_ANSWER="CLASH"` in
`apps/server/.dev.vars`, then repeat the two-client flow in each mode.

- **Real-time:** guesses reveal immediately; the first `CLASH` ends the match.
  Ten incorrect guesses eliminate a player without ending another player's race.
- **Synchronous:** set the host-controlled round limit to 1, 3, and 5 minutes
  in turn; one guess locks per player per round, and neither word reveals until
  everyone submits or that deadline closes. A single `CLASH`
  wins; simultaneous `CLASH` submissions enter the dance-off boundary.
- Reload either gameplay tab and confirm its board and terminal result recover.

---

## 3. Test suites

| Suite | Command | Covers |
|---|---|---|
| Shared unit | `pnpm --filter @wordle-clash/shared test` | `room-code` (format, no I/O, `normalizeRoomCode`), `protocol` (round-trip + reject malformed), `game-modes`, `avatars` |
| Worker / DO | `pnpm --filter @wordle-clash/server test` | `Room` DO via `@cloudflare/vitest-pool-workers`: join → snapshot, second join → mutual visibility, host reassignment, ready gating, malformed frame → `BAD_MESSAGE`, capacity → `ROOM_FULL` |
| Web unit | `pnpm --filter @wordle-clash/web test` | component logic (added from epic 04) |
| E2E | `pnpm --filter @wordle-clash/e2e test` | Playwright: single-context create flow; two-context join + cross-context sync + host reassignment + `matchStarting` dialog |

---

## 4. Deploy check (before shipping)

```sh
pnpm build
pnpm --filter @wordle-clash/server run deploy  # wrangler deploy: assets + Worker + DO + D1
```

Prerequisites (one-time, need Cloudflare login): `wrangler login`,
`wrangler d1 create wordle-clash` (paste `database_id` into `wrangler.jsonc`),
`wrangler secret put BETTER_AUTH_SECRET` / `RT_TICKET_SECRET` (epic 03).
