import { getAnimalName } from '@wordle-clash/shared'

import styles from './AnimalIcon.module.scss'

export interface AnimalIconProps {
  animalId: number
}

export function AnimalIcon({ animalId }: AnimalIconProps) {
  const animal = getAnimalName(animalId)

  return (
    <img
      className={styles.animalIcon}
      src={`/avatars/${animal}.svg`}
      alt=""
      aria-hidden="true"
    />
  )
}
