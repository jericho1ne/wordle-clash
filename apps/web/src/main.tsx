import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import './styles/ember.css'
import './styles/animations.css'
import { IdentityProvider } from './identity'
import { router } from './router'

const container = document.getElementById('root')
if (!container) throw new Error('#root element not found')

createRoot(container).render(
  <StrictMode>
    <IdentityProvider>
      <RouterProvider router={router} />
    </IdentityProvider>
  </StrictMode>,
)
