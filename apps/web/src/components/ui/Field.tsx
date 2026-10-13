import type { ReactNode } from 'react'

import styles from './Field.module.scss'

export interface FieldProps {
  label: ReactNode
  /** `id` of the control this field labels. */
  htmlFor: string
  /** Muted helper text below the control. */
  hint?: ReactNode
  /** Error text below the control — takes precedence over `hint`. */
  error?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * A labelled form row: the global Ember `.field` (label styling) plus an
 * optional hint / error line. Wrap an `<Input>` (or any control) as the child;
 * give it `id={htmlFor}` so the label associates.
 */
export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  const message = error ?? hint
  const messageClass = error != null ? styles.error : styles.hint
  const messageId = message != null ? `${htmlFor}-${error != null ? 'error' : 'hint'}` : undefined

  return (
    <div className={['field', styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {message != null && (
        <p className={messageClass} id={messageId}>
          {message}
        </p>
      )}
    </div>
  )
}
