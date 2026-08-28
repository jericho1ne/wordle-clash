import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const TEST_SECRET = 'test-only-secret-with-at-least-thirty-two-characters'

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: './src/index.ts',
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          BETTER_AUTH_SECRET: TEST_SECRET,
          RT_TICKET_SECRET: TEST_SECRET,
        },
      },
    }),
  ],
  test: {
    isolate: false,
    maxWorkers: 1,
  },
})
