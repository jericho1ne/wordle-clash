import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: never set `base` — keep the app mounted at `/`. The Worker serves the
// built assets in production with SPA fallback (see apps/server/wrangler.jsonc).
//
// Dev runs two processes: `vite` here (port 5173) and `wrangler dev` for the
// Worker (port 8787). Requests to /api and /ws are proxied to the Worker so the
// browser only ever talks to one origin. Adopting @cloudflare/vite-plugin for a
// single-process dev server is a later optimization (see
// docs/stories/00-app-scaffold/06-dev-server-and-deploy.md).
const WORKER_ORIGIN = process.env.WORKER_ORIGIN ?? 'http://localhost:8787';

export default defineConfig({
  plugins: [react()],
  css: {
    // `.title-screen` in a *.module.scss is referenced as `styles.titleScreen`.
    modules: { localsConvention: 'camelCaseOnly' },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: WORKER_ORIGIN, changeOrigin: true },
      '/ws': { target: WORKER_ORIGIN, changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
