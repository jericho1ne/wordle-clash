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
import { router } from './router'
import { ToastProvider } from './components/toast/ToastProvider'

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
