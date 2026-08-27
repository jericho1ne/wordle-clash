import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { ButtonVariant } from './Button';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  variant?: ButtonVariant;
  /** Required — an icon-only control needs an accessible name. */
  'aria-label': string;
  /** The icon element. */
  children: ReactNode;
}

/**
 * Square icon-only button (`.btn .btn-icon`). Same pass-through rules as
 * `<Button>`; `aria-label` is mandatory. Default variant `ghost`.
 */
export function IconButton({
  variant = 'ghost',
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  const classes = ['btn', 'btn-icon', VARIANT_CLASS[variant]];
  if (className) classes.push(className);

  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {children}
    </button>
  );
}
