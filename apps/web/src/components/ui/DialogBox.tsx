import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'

import styles from './DialogBox.module.scss'

export type DialogBoxAlignment = 'left' | 'center' | 'right'

export interface DialogBoxProps {
  open: boolean
  title: string
  children: ReactNode
  actions: ReactNode
  onOpenChange: (open: boolean) => void
  className?: string
  /** Horizontal alignment of the title, body, and actions. Defaults to 'left'. */
  alignment?: DialogBoxAlignment
  /** Dialog width as a percent of the viewport (0-100), e.g. 50 -> 50vw. Defaults to the built-in max-width. */
  widthPercent?: number
}

const ALIGNMENT_CLASS: Record<DialogBoxAlignment, string> = {
  left: 'alignLeft',
  center: 'alignCenter',
  right: 'alignRight',
}

export function DialogBox({
  open,
  title,
  children,
  actions,
  onOpenChange,
  className,
  alignment = 'left',
  widthPercent,
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
      className={[styles.dialogBox, styles[ALIGNMENT_CLASS[alignment]], className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClose={() => onOpenChange(false)}
    >
      <div
        className={styles.surface}
        style={widthPercent === undefined ? undefined : { width: `${widthPercent}vw` }}
      >
        <div id={titleId} className={styles.title}>{title}</div>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </dialog>
  )
}
