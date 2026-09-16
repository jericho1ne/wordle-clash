import { clampAvatarId } from '@wordle-clash/shared'

import styles from './Avatar.module.scss'
import { AnimalIcon } from './AnimalIcon'

export interface AvatarProps {
  avatarId: number
  animalId: number
  size?: 'default' | 'lobby'
}

export function Avatar({ avatarId, animalId, size = 'default' }: AvatarProps) {
  return (
    <span
      className={[styles.avatar, size === 'lobby' ? styles.lobby : null]
        .filter(Boolean)
        .join(' ')}
      data-avatar-id={clampAvatarId(avatarId)}
      aria-hidden="true"
    >
      <AnimalIcon animalId={animalId} />
    </span>
  )
}
