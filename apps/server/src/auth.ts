import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { anonymous } from 'better-auth/plugins'

import { createDb } from './db/client'
import * as schema from './db/schema'

const LOCAL_WORKER_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
])

const LOCAL_WEB_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function requireBetterAuthSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters')
  }

  return secret
}

function isLocalWorkerRequest(request: Request): boolean {
  const url = new URL(request.url)

  return url.protocol === 'http:' && LOCAL_WORKER_HOSTS.has(url.hostname)
}

function resolveOrigins(request: Request): { baseURL: string, trustedOrigins: string[] } {
  const workerOrigin = new URL(request.url).origin
  const browserOrigin = request.headers.get('Origin')
  const isLocalProxyRequest =
    isLocalWorkerRequest(request) &&
    browserOrigin !== null &&
    LOCAL_WEB_ORIGINS.has(browserOrigin)

  if (isLocalProxyRequest) {
    return {
      baseURL: browserOrigin,
      trustedOrigins: [workerOrigin, browserOrigin],
    }
  }

  return {
    baseURL: workerOrigin,
    trustedOrigins: [workerOrigin],
  }
}

/** Create a request-scoped Better Auth instance backed by the Worker D1 binding. */
export function createAuth(request: Request, env: Env) {
  const { baseURL, trustedOrigins } = resolveOrigins(request)

  return betterAuth({
    appName: 'Wordle Clash',
    baseURL,
    secret: requireBetterAuthSecret(env.BETTER_AUTH_SECRET),
    trustedOrigins,
    database: drizzleAdapter(createDb(env.DB), {
      provider: 'sqlite',
      schema,
    }),
    plugins: [anonymous()],
    user: {
      additionalFields: {
        displayName: {
          type: 'string',
          required: false,
        },
        avatarId: {
          type: 'number',
          required: false,
        },
        animalId: {
          type: 'number',
          required: false,
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
