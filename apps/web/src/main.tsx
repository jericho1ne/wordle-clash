import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import './styles/ember.css'
import './styles/animations.css'
import {
  IdentityProvider,
  ProfileProvider,
} from './identity'
import { router } from './router'

const container = document.getElementById('root')
if (!container) throw new Error('#root element not found')

createRoot(container).render(
  <StrictMode>
    <IdentityProvider>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
    </IdentityProvider>
  </StrictMode>,
)
