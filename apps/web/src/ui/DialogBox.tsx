import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'

import styles from './DialogBox.module.scss'

export interface DialogBoxProps {
  open: boolean
  title: string
  children: ReactNode
  actions: ReactNode
  onOpenChange: (open: boolean) => void
  className?: string
}

export function DialogBox({
  open,
  title,
  children,
  actions,
  onOpenChange,
  className,
}: DialogBoxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal()
    if (!open && dialogRef.current?.open) dialogRef.current.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={[styles.dialogBox, className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClose={() => onOpenChange(false)}
    >
      <div className={styles.surface}>
        <div id={titleId} className={styles.title}>{title}</div>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </dialog>
  )
}
