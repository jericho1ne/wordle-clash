import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import {
  anonymous,
  username,
} from 'better-auth/plugins'
import { eq } from 'drizzle-orm'

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
  const db = createDb(env.DB)

  return betterAuth({
    appName: 'Wordle Clash',
    baseURL,
    secret: requireBetterAuthSecret(env.BETTER_AUTH_SECRET),
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword: { enabled: true },
    plugins: [
      anonymous({
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          const [guest, account] = await Promise.all([
            db
              .select({
                displayName: schema.user.displayName,
                avatarId: schema.user.avatarId,
                animalId: schema.user.animalId,
              })
              .from(schema.user)
              .where(eq(schema.user.id, anonymousUser.user.id))
              .get(),
            db
              .select({
                displayName: schema.user.displayName,
                avatarId: schema.user.avatarId,
                animalId: schema.user.animalId,
              })
              .from(schema.user)
              .where(eq(schema.user.id, newUser.user.id))
              .get(),
          ])

          if (!guest || !account) return

          const hasProfile = Boolean(account.displayName) ||
            account.avatarId !== null && account.avatarId !== undefined ||
            account.animalId !== null && account.animalId !== undefined

          if (hasProfile) return

          await db
            .update(schema.user)
            .set({
              displayName: guest.displayName,
              avatarId: guest.avatarId,
              animalId: guest.animalId,
            })
            .where(eq(schema.user.id, newUser.user.id))
        },
      }),
      username({
        displayUsername: false,
        immutableUsername: true,
      }),
    ],
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
