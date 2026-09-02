import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

import { forwardRef } from 'react'

import styles from './Button.module.scss'

export type ButtonAppearance = 'primary' | 'secondary' | 'outline'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment. Defaults to `primary`. */
  appearance?: ButtonAppearance
  /** Full-width button. */
  block?: boolean
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode
  /** Icon rendered after the label. */
  trailingIcon?: ReactNode
}

/**
 * Shared button primitive. Defaults `type="button"` so it never submits a form
 * by accident. `disabled`, `onClick`, `aria-*`, etc. pass straight through.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    appearance = 'primary',
    block = false,
    leadingIcon,
    trailingIcon,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref,
) {
  const classes = [styles.button, styles[appearance]]
  if (block) classes.push(styles.block)
  if (className) classes.push(className)

  return (
    <button ref={ref} type={type} className={classes.join(' ')} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})
