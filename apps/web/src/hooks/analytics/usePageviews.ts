import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { pageview } from '@/lib/analytics'

/** Sends one page view per path change. Mount once inside the router. */
export function usePageviews() {
  const { pathname } = useLocation()

  useEffect(() => {
    pageview(pathname)
  }, [pathname])
}
