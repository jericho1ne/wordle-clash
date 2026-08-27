import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input over the Ember `.input` class — no styling of its own. Defaults
 * `type="text"`. `value`/`onChange`, `maxLength`, `placeholder`, `inputMode`,
 * `autoCapitalize`, `disabled`, `aria-*`, … all pass straight through.
 */
export function Input({ className, type = 'text', ...rest }: InputProps) {
  return <input type={type} className={className ? `input ${className}` : 'input'} {...rest} />;
}
