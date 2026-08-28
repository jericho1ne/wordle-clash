import {
  anonymousClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [
    anonymousClient(),
    inferAdditionalFields({
      user: {
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
    }),
  ],
})
