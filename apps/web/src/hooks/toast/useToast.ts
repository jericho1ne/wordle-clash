import { use } from 'react'

import { ToastContext } from '@/lib/toast/toast-context'

export function useToast() {
  const context = use(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
