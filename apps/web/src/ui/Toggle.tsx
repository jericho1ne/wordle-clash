import * as TogglePrimitive from '@radix-ui/react-toggle'
import type { ComponentPropsWithoutRef } from 'react'

import styles from './Toggle.module.scss'

export type ToggleProps = ComponentPropsWithoutRef<typeof TogglePrimitive.Root>

export function Toggle({ className, ...props }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
