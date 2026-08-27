import type { ReactNode } from 'react'

import styles from './RadioGroup.module.scss'

export interface RadioOption<T extends string> {
  value: T
  label: ReactNode
}

export interface RadioGroupProps<T extends string> {
  /** Radio-group name — must be unique per control on the page. */
  name: string
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * Stacked radio list over the Ember `.radio` / `.dot` classes (native radios
 * under `<label>`s). The module only handles vertical spacing.
 */
export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  ...aria
}: RadioGroupProps<T>) {
  return (
    <div className={styles.radioGroup} role="radiogroup" {...aria}>
      {options.map((opt) => (
        <label key={opt.value} className="radio">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="dot" />
          {opt.label}
        </label>
      ))}
    </div>
  )
}
