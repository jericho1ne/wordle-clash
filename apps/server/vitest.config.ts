import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

// Runs tests inside workerd with the real Durable Object + D1 bindings from
// wrangler.jsonc. RoomServer tests land in epic 02-realtime-foundation/09.
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
});
