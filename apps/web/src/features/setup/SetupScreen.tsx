import {
  useState,
  type FormEvent,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router'

import {
  isValidRoomCode,
  MAX_NAME_LENGTH,
  normalizeRoomCode,
} from '@wordle-clash/shared'

import { useProfile } from '../../identity'
import {
  Button,
  Field,
  IconButton,
  Input,
  SegmentedControl,
} from '../../ui'
import { AvatarPicker } from './AvatarPicker'
import { AnimalPicker } from './AnimalPicker'
import {
  createRoom,
  verifyRoomJoin,
} from './room-entry'
import {
  getRandomAnimalId,
  isSetupSubmissionValid,
  type RoomEntryMode,
} from './setup-form'
import styles from './SetupScreen.module.scss'

export function SetupScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, setProfile } = useProfile()
  const inviteValue = searchParams.get('join')
  const inviteCode = normalizeRoomCode(inviteValue ?? '')
  const isInvite = inviteValue !== null
  const validInvite = isInvite && isValidRoomCode(inviteCode)
  const [name, setName] = useState(profile.name)
  const [avatarId, setAvatarId] = useState(profile.avatarId)
  const [animalId, setAnimalId] = useState(() => getRandomAnimalId())
  const [mode, setMode] = useState<RoomEntryMode>(isInvite ? 'join' : 'create')
  const [roomCode, setRoomCode] = useState(isInvite ? inviteCode : '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(
    isInvite && !validInvite ? 'This invitation has an invalid room code.' : null,
  )
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const canSubmit = isSetupSubmissionValid(name, animalId, mode, roomCode) && !pending
  const submitLabel = pending
    ? mode === 'create' ? 'Creating room…' : 'Joining room…'
    : mode === 'create' ? 'Create room' : 'Join room'

  const changeMode = (nextMode: RoomEntryMode) => {
    setMode(nextMode)
    setError(null)
  }

  const leaveInvite = () => {
    setSearchParams({})
    setMode('join')
    setRoomCode('')
    setError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setPending(true)
    setError(null)

    try {
      await setProfile({ name, avatarId, animalId })

      if (mode === 'create') {
        navigate(`/room/${await createRoom()}`)
      }
      else {
        const normalizedCode = normalizeRoomCode(roomCode)
        await verifyRoomJoin(normalizedCode)
        navigate(`/room/${normalizedCode}`)
      }
    }
    catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to enter the room')
      setPending(false)
    }
  }

  return (
    <div className={`app-stage ${styles.setupScreen}`}>
      <div className="app-stage__inner">
        <form className={styles.form} aria-busy={pending} onSubmit={submit}>
          <IconButton
            aria-label="Back to title"
            className={styles.back}
            disabled={pending}
            onClick={() => navigate('/')}
          >
            <span aria-hidden="true">←</span>
          </IconButton>

          <div className={styles.intro}>
            <div className={styles.kicker}>{isInvite ? 'Room invitation' : 'Player profile'}</div>
            <h1 className={styles.heading}>
              {isInvite ? `Join ${inviteCode || 'a room'}` : 'Set up your player'}
            </h1>
            <p className={styles.description}>
              {isInvite
                ? 'Choose how your friend will see you in the room.'
                : 'Choose how friends will see you in the room.'}
            </p>
          </div>

          <fieldset className={styles.controls} disabled={pending}>
            <Field label="Your name" htmlFor="player-name">
              <Input
                id="player-name"
                name="playerName"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                placeholder="e.g. Nova"
                autoComplete="nickname"
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
              />
            </Field>

            <div className={styles.avatarField}>
              <div className={styles.label}>Your avatar</div>
              <div className={styles.avatarControls}>
                <AvatarPicker
                  avatarId={avatarId}
                  initial={initial}
                  disabled={pending}
                  onChange={setAvatarId}
                />
                <AnimalPicker
                  animalId={animalId}
                  disabled={pending}
                  onChange={setAnimalId}
                />
              </div>
            </div>

            {!isInvite && (
              <div className={styles.modeField}>
                <div className={styles.label} id="room-entry-label">Room</div>
                <SegmentedControl
                  name="room-entry-mode"
                  aria-labelledby="room-entry-label"
                  value={mode}
                  onChange={changeMode}
                  options={[
                    {
                      value: 'create',
                      label: 'Create room',
                      icon: <span aria-hidden="true">+</span>,
                    },
                    {
                      value: 'join',
                      label: 'Join room',
                      icon: <span aria-hidden="true">→</span>,
                    },
                  ]}
                />
              </div>
            )}

            {mode === 'join' && (
              <Field
                label="Room code"
                htmlFor="room-code"
                hint="Four letters and four numbers"
              >
                <Input
                  id="room-code"
                  name="roomCode"
                  value={roomCode}
                  className={styles.roomCode}
                  placeholder="e.g. PLUM-7421"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  readOnly={isInvite}
                  onChange={(event) => {
                    setRoomCode(normalizeRoomCode(event.target.value))
                    setError(null)
                  }}
                />
              </Field>
            )}
          </fieldset>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {isInvite && error && (
            <Button variant="ghost" onClick={leaveInvite}>
              Enter a different room code
            </Button>
          )}

          <Button type="submit" block disabled={!canSubmit}>
            {submitLabel}
          </Button>
        </form>
      </div>
    </div>
  )
}
