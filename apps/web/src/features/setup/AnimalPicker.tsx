import {
  useRef,
  type KeyboardEvent,
} from 'react'

import {
  ANIMAL_NAMES,
  getAnimalName,
} from '@wordle-clash/shared'

import {
  AnimalIcon,
  Button,
} from '../../ui'
import styles from './AnimalPicker.module.scss'

interface AnimalPickerProps {
  animalId: number | null
  disabled?: boolean
  onChange: (animalId: number) => void
}

const GRID_COLUMNS = 4

export function AnimalPicker({
  animalId,
  disabled = false,
  onChange,
}: AnimalPickerProps) {
  const details = useRef<HTMLDetailsElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const select = (index: number) => {
    onChange(index)
    details.current?.removeAttribute('open')
  }

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowLeft') nextIndex = index - 1
    if (event.key === 'ArrowRight') nextIndex = index + 1
    if (event.key === 'ArrowUp') nextIndex = index - GRID_COLUMNS
    if (event.key === 'ArrowDown') nextIndex = index + GRID_COLUMNS
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = ANIMAL_NAMES.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    const wrappedIndex = (nextIndex + ANIMAL_NAMES.length) % ANIMAL_NAMES.length
    buttons.current[wrappedIndex]?.focus()
  }

  return (
    <details ref={details} className={styles.animalPicker}>
      <summary aria-label="Choose an animal avatar" aria-disabled={disabled}>
        {animalId === null
          ? <span className={styles.placeholder}>Spirit Animal</span>
          : (
              <>
                <AnimalIcon animalId={animalId} />
                <span>{getAnimalName(animalId)}</span>
              </>
            )}
      </summary>
      <div className={styles.grid} role="listbox" aria-label="Animal avatars">
        {ANIMAL_NAMES.map((animal, index) => (
          <Button
            appearance="outline"
            key={animal}
            ref={(button) => {
              buttons.current[index] = button
            }}
            type="button"
            role="option"
            aria-selected={animalId === index}
            aria-label={animal}
            disabled={disabled}
            onClick={() => select(index)}
            onKeyDown={(event) => move(event, index)}
          >
            <AnimalIcon animalId={index} />
          </Button>
        ))}
      </div>
    </details>
  )
}
