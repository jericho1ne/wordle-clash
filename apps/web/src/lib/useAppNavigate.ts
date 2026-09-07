import { useCallback } from 'react'
import {
  useNavigate,
  type NavigateOptions,
  type To,
} from 'react-router'

/**
 * Same as react-router's `useNavigate`, but fades between routes using the
 * browser's native View Transitions API (unsupported browsers just get the
 * usual instant navigation — no fallback code needed). Skips the fade
 * entirely under `prefers-reduced-motion: reduce`.
 */
export function useAppNavigate() {
  const navigate = useNavigate()

  return useCallback((to: To, options?: NavigateOptions) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    navigate(to, reduceMotion ? options : { ...options, viewTransition: true })
  }, [navigate])
}
