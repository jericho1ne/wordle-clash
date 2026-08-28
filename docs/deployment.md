# Deployment

How Wordle Clash ships to production and how `wordleclash.com` is wired up.

Everything is **one Cloudflare Worker** named `wordle-clash` — SPA assets,
`/api/*`, `/ws/*`, the `Room` Durable Object, and the D1 database — deployed in a
single `wrangler deploy`. There is no separate frontend host.

The client is fully **same-origin**: `apps/web/src/realtime/room-socket.ts` uses
`window.location.host` (and `wss`/`ws` off the page protocol), and
`apps/server/src/auth.ts` derives `baseURL` / `trustedOrigins` from the incoming
request origin. Once the Worker answers on `wordleclash.com`, the app works there
with **no client or config changes** — there is no API URL to set.

---

## 1. First production deploy (one-time prerequisites)

Also summarised in [`verification.md`](./verification.md) §4.

- `wrangler login` — or rely on `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
  in `apps/server/.env` (gitignored; never commit it).
- D1 already exists — `database_id` is filled in `apps/server/wrangler.jsonc`, so
  no `wrangler d1 create` is needed.
- Set the two runtime secrets (they currently only exist in local `.dev.vars`):

  ```sh
  cd apps/server
  wrangler secret put BETTER_AUTH_SECRET
  wrangler secret put RT_TICKET_SECRET
  ```

- Apply migrations to remote D1:

  ```sh
  pnpm db:migrate:remote
  ```

- Deploy (runs `pnpm build` then `wrangler deploy` from `apps/server`):

  ```sh
  pnpm deploy
  ```

This gives `wordle-clash.<your-subdomain>.workers.dev`. Smoke-test it before
attaching the domain:

- `curl https://wordle-clash.<subdomain>.workers.dev/api/health` → `{"ok":true,…}`
- Run the two-client lobby flow from [`verification.md`](./verification.md) §2.

---

## 2. DNS / custom domain for `wordleclash.com`

The zone must live on Cloudflare, but you will not hand-edit DNS records.

### If `wordleclash.com` is not yet a Cloudflare zone

1. Add the site in the Cloudflare dashboard.
2. Change the nameservers at your registrar to the two Cloudflare assigns.
3. Wait for the zone to show **Active**.

### Attach the Worker via a Custom Domain (preferred)

Custom Domains beat plain Routes here: Cloudflare creates the proxied DNS record
and provisions the TLS certificate automatically.

Add to `apps/server/wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "wordleclash.com", "custom_domain": true },
  { "pattern": "www.wordleclash.com", "custom_domain": true }
]
```

Then `wrangler deploy`. (Dashboard equivalent: Workers & Pages → `wordle-clash` →
Settings → Domains & Routes → Add.) No manual `A` / `CNAME` entry — the Custom
Domain feature manages it.

### Canonical host

Serving both apex and `www` is fine. For a single canonical host, add a Redirect
Rule (`www.wordleclash.com/*` → `https://wordleclash.com/$1`, 308) and drop the
`www` custom domain.

### When manual DNS is needed

Only if you use a plain **Route** instead of a Custom Domain — then add a proxied
placeholder `AAAA` record (`100::`) for the route to bind to. Prefer the Custom
Domain path and skip this.

---

## 3. Gotchas on the first production run

- **better-auth on Workers in production is a known risk** (see
  [`architecture.md`](./architecture.md) → "Known risks / watch items"). Verify
  the anonymous session mint and `POST /api/rt/ticket` work on the deployed
  origin, not just locally. Fallback is a small HMAC-signed-cookie guest identity
  using the same table names.
- The Durable Object migration `v1` (`new_sqlite_classes: ["Room"]`) applies on
  the first deploy — fine on the Workers free plan (SQLite-backed DOs).
- `compatibility_date` is `2026-08-01` with `nodejs_compat` — already set in
  `wrangler.jsonc`.

---

## 4. CI deploy automation (optional, not yet done)

[`docs/stories/00-app-scaffold/07-ci.md`](./stories/00-app-scaffold/07-ci.md)
deferred this ("No deploy automation in Phase 1"). When wanted: a `deploy.yml` on
push to `main` (or on a release tag) running `wrangler deploy` with
`CLOUDFLARE_API_TOKEN` as a GitHub Actions repo secret, gated behind the existing
`verify` job in `.github/workflows/ci.yml`.
