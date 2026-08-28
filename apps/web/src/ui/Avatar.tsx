import { clampAvatarId } from '@wordle-clash/shared'

import styles from './Avatar.module.scss'
import { AnimalIcon } from './AnimalIcon'

export interface AvatarProps {
  avatarId: number
  animalId: number
}

export function Avatar({ avatarId, animalId }: AvatarProps) {
  return (
    <span
      className={styles.avatar}
      data-avatar-id={clampAvatarId(avatarId)}
      aria-hidden="true"
    >
      <AnimalIcon animalId={animalId} />
    </span>
  )
}
