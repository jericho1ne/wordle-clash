import type { ReactNode } from 'react'

import styles from './PlayerBoardFrame.module.scss'

interface PlayerBoardFrameProps {
  children: ReactNode
  name: string
  score: number
  highest: number
  isLeader: boolean
  playerColorId: number
}

export function PlayerBoardFrame({ children, name, score, highest, isLeader, playerColorId }: PlayerBoardFrameProps) {
  return (
    <div className={styles.playerBoardFrame} data-player-color-id={playerColorId}>
      <progress
        className={styles.progressScoreBar}
        value={Math.max(0, score)}
        max={highest || 1}
        aria-label={`${name}: score relative to first place`}
        aria-valuetext={`${score} points; highest score ${highest}`}
      />
      <div className={styles.board}>
        {isLeader && <span className={styles.star} role="img" aria-label={`${name} is in first place`} />}
        {children}
      </div>
    </div>
  )
}
