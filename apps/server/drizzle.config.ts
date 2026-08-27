import { defineConfig } from 'drizzle-kit';

// `drizzle-kit generate` emits SQL into ./migrations; `wrangler d1 migrations
// apply wordle-clash --local|--remote` applies it. One migration ledger,
// owned by wrangler. Real tables land in epic 03-identity-auth/01.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
});
