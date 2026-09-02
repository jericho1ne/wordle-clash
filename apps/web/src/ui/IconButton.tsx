import type { ButtonHTMLAttributes } from 'react'

import {
  Button,
  type ButtonAppearance,
} from './Button'
import styles from './IconButton.module.scss'

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  appearance?: ButtonAppearance
  /** Required — an icon-only control needs an accessible name. */
  'aria-label': string
}

/**
 * Square icon-only `Button`; `aria-label` is mandatory. Defaults to `outline`.
 */
export function IconButton({
  appearance = 'outline',
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <Button
      appearance={appearance}
      type={type}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Button>
  )
}
