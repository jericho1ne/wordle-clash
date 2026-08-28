import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'

import styles from './Dialog.module.scss'

export interface DialogProps {
  open: boolean
  title: string
  children: ReactNode
  actions: ReactNode
  onOpenChange: (open: boolean) => void
}

export function Dialog({
  open,
  title,
  children,
  actions,
  onOpenChange,
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    if (!open && dialog.current?.open) dialog.current.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClose={() => onOpenChange(false)}
    >
      <div className="dialog">
        <div id={titleId} className="dialog-title">{title}</div>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </dialog>
  )
}
