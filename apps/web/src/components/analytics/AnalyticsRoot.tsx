import { Outlet } from 'react-router'

import { usePageviews } from '@/hooks/analytics/usePageviews'

/** Pathless root route: tracks page views for every child route. */
export function AnalyticsRoot() {
  usePageviews()

  return <Outlet />
}
