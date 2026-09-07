import {
  useId,
  useState,
  type FormEvent,
} from 'react'

import { authClient } from '../../identity/auth-client'
import { useIdentity } from '../../identity/useIdentity'
import {
  Button,
  DialogBox,
  Field,
  Input,
} from '../../ui'
import styles from './AccountDialog.module.scss'

type AccountMode = 'sign-in' | 'sign-up'

export interface AccountDialogProps {
  open: boolean
  initialMode: AccountMode
  onOpenChange: (open: boolean) => void
}

export function AccountDialog({
  open,
  initialMode,
  onOpenChange,
}: AccountDialogProps) {
  const usernameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const { refreshIdentity } = useIdentity()
  const [mode, setMode] = useState<AccountMode>(initialMode)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Resets mode/error whenever the dialog opens (or initialMode changes
  // while open) by adjusting state during render rather than in an effect —
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-when-a-prop-changes.
  const [prevOpenState, setPrevOpenState] = useState({ open, initialMode })
  if (open && (prevOpenState.open !== open || prevOpenState.initialMode !== initialMode)) {
    setPrevOpenState({ open, initialMode })
    setMode(initialMode)
    setError(null)
  }

  const changeMode = (nextMode: AccountMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '')
    const password = String(form.get('password') ?? '')

    setSubmitting(true)
    setError(null)

    const result = mode === 'sign-up'
      ? await authClient.signUp.email({
          email: String(form.get('email') ?? ''),
          name: username,
          password,
          username,
        })
      : await authClient.signIn.username({ username, password })

    setSubmitting(false)

    if (result.error) {
      setError(result.error.message ?? 'Unable to complete that request')
      return
    }

    await refreshIdentity()
    onOpenChange(false)
  }

  const formId = mode === 'sign-up' ? 'sign-up-form' : 'sign-in-form'

  return (
    <DialogBox
      className={styles.accountDialog}
      open={open}
      title={mode === 'sign-up' ? 'Create your account' : 'Welcome back'}
      onOpenChange={handleOpenChange}
      actions={(
        <Button form={formId} type="submit" block disabled={submitting}>
          {submitting ? 'Working…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </Button>
      )}
    >
      <div className={styles.modeSwitch} aria-label="Account action">
        <Button
          appearance="secondary"
          aria-pressed={mode === 'sign-up'}
          onClick={() => changeMode('sign-up')}
        >
          Sign up
        </Button>
        <Button
          appearance="secondary"
          aria-pressed={mode === 'sign-in'}
          onClick={() => changeMode('sign-in')}
        >
          Sign in
        </Button>
      </div>
      <form id={formId} className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Username"
          htmlFor={usernameId}
          hint="Username and avatar are publicly visible"
        >
          <Input
            id={usernameId}
            name="username"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            required
          />
        </Field>
        {mode === 'sign-up' && (
          <Field label="Email" htmlFor={emailId} hint="Your email will never be publicly displayed">
            <Input id={emailId} name="email" type="email" autoComplete="email" required />
          </Field>
        )}
        <Field label="Password" htmlFor={passwordId} hint={mode === 'sign-up' ? 'At least 8 characters.' : undefined}>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            minLength={8}
            maxLength={128}
            required
          />
        </Field>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>
    </DialogBox>
  )
}
