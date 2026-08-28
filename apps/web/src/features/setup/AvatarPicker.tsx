import {
  useRef,
  type KeyboardEvent,
} from 'react'

import { AVATAR_STEPS } from '@wordle-clash/shared'

import styles from './AvatarPicker.module.scss'

interface AvatarPickerProps {
  avatarId: number
  initial: string
  disabled?: boolean
  onChange: (avatarId: number) => void
}

export function AvatarPicker({
  avatarId,
  initial,
  disabled = false,
  onChange,
}: AvatarPickerProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const selectWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + AVATAR_STEPS.length) % AVATAR_STEPS.length
    }
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % AVATAR_STEPS.length
    }
    else if (event.key === 'Home') {
      nextIndex = 0
    }
    else if (event.key === 'End') {
      nextIndex = AVATAR_STEPS.length - 1
    }

    if (nextIndex === null) return

    event.preventDefault()
    onChange(nextIndex)
    buttons.current[nextIndex]?.focus()
  }

  return (
    <div className={styles.avatarPicker} role="radiogroup" aria-label="Choose an avatar color">
      {AVATAR_STEPS.map((step, index) => (
        <button
          key={step.name}
          ref={(button) => {
            buttons.current[index] = button
          }}
          type="button"
          role="radio"
          aria-checked={avatarId === index}
          aria-label={`${step.name} avatar`}
          className={styles.option}
          data-avatar-id={index}
          disabled={disabled}
          tabIndex={avatarId === index ? 0 : -1}
          onClick={() => onChange(index)}
          onKeyDown={(event) => selectWithKeyboard(event, index)}
        >
          <span aria-hidden="true">{initial}</span>
        </button>
      ))}
    </div>
  )
}
