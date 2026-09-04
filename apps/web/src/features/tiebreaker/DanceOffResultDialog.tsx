import type { ReactNode } from 'react'

import { DialogBox } from '../../ui'
import styles from './DanceOffResultDialog.module.scss'

export interface DanceOffPlayerResult {
  name: string
  score: number
}

export interface DanceOffResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Shown on the left. */
  left: DanceOffPlayerResult
  /** Shown on the right. */
  right: DanceOffPlayerResult
  /** Which side won, or null for an exact tie. */
  winnerSide: 'left' | 'right' | null
  actions: ReactNode
}

/** The celebratory result popover for a dance-off — shown in place of any inline "X wins!" text. */
export function DanceOffResultDialog({ open, onOpenChange, left, right, winnerSide, actions }: DanceOffResultDialogProps) {
  const winner = winnerSide === 'left' ? left : winnerSide === 'right' ? right : null

  return (
    <DialogBox
      open={open}
      onOpenChange={onOpenChange}
      title={winner ? `${winner.name} Wins!` : 'It\'s a tie!'}
      actions={actions}
    >
      <div className={styles.scoreboard}>
        <div className={styles.names}>
          <div className={styles.name}>{left.name}</div>
          <div className={styles.name}>{right.name}</div>
        </div>
        <div className={styles.scores}>
          <div className={`${styles.score} ${winnerSide === 'left' ? styles.winnerScore : ''}`}>{left.score}</div>
          <div className={`${styles.score} ${winnerSide === 'right' ? styles.winnerScore : ''}`}>{right.score}</div>
        </div>
      </div>
    </DialogBox>
  )
}
