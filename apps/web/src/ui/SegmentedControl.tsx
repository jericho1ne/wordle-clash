import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  name: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <div className="seg" role="radiogroup" {...aria}>
      {options.map((opt) => (
        <label key={opt.value} className="seg-opt">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.icon}
          {opt.label}
        </label>
      ))}
    </div>
  )
}
