import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style — maps to the Ember `.btn-*` classes. Default `primary`. */
  variant?: ButtonVariant;
  /** Full-width (`.btn-block`). */
  block?: boolean;
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label. */
  trailingIcon?: ReactNode;
}

/**
 * Thin wrapper over the Ember `.btn` classes — no styling of its own. Defaults
 * `type="button"` so it never submits a form by accident. `disabled`, `onClick`,
 * `aria-*`, etc. pass straight through.
 */
export function Button({
  variant = 'primary',
  block = false,
  leadingIcon,
  trailingIcon,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant]];
  if (block) classes.push('btn-block');
  if (className) classes.push(className);

  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
