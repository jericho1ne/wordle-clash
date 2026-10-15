import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import './styles/ember.css'
import './styles/animations.css'
import {
  FavoritesProvider,
  IdentityProvider,
  ProfileProvider,
} from './components/identity'
import { initAnalytics } from '@lowtyde/analytics'
import { router } from './router'
import { ToastProvider } from './components/toast/ToastProvider'

// The container id comes only from VITE_GTM_ID. Only production builds load GTM.
initAnalytics({
  containerId: import.meta.env.PROD ? import.meta.env.VITE_GTM_ID : undefined,
})

const container = document.getElementById('root')
if (!container) throw new Error('#root element not found')

createRoot(container).render(
  <StrictMode>
    <IdentityProvider>
      <ProfileProvider>
        <FavoritesProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </FavoritesProvider>
      </ProfileProvider>
    </IdentityProvider>
  </StrictMode>,
)
