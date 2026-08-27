/**
 * Hand-written for the scaffold. Regenerate from wrangler.jsonc with
 * `pnpm --filter @wordle-clash/server cf-typegen` (runs `wrangler types`),
 * which will overwrite this file with the full generated bindings.
 */
declare namespace Cloudflare {
  interface Env {
    /** Built SPA assets, with SPA fallback (see wrangler.jsonc). */
    ASSETS: Fetcher
    /** One Durable Object per room, addressed by room code. */
    ROOM: DurableObjectNamespace
    /** D1: accounts, favorites, (inert) match history. */
    DB: D1Database
    /** Set via `wrangler secret put` / .dev.vars. */
    BETTER_AUTH_SECRET: string
    RT_TICKET_SECRET?: string
  }
}

interface Env extends Cloudflare.Env {}
