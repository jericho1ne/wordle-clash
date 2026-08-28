import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router'

import {
  isValidGuess,
  isValidRoomCode,
  normalizeGuess,
  normalizeRoomCode,
  WORD_LENGTH,
  type EvaluatedGuess,
} from '@wordle-clash/shared'

import { useRoomStore } from '../../realtime'
import {
  Avatar,
  Button,
  Tag,
} from '../../ui'
import styles from './GameplayScreen.module.scss'

function GuessRow({ guess }: { guess: EvaluatedGuess }) {
  return (
    <div className={styles.guessRow} aria-label={`${guess.word} result`}>
      {guess.word.split('').map((letter, index) => (
        <span key={`${index}-${letter}`} data-mark={guess.tiles[index]}>
          {letter}
        </span>
      ))}
    </div>
  )
}

function EmptyRow() {
  return (
    <div className={styles.guessRow} aria-hidden="true">
      {Array.from({ length: WORD_LENGTH }, (_, index) => <span key={index} />)}
    </div>
  )
}

function PendingGuessRow({ guess }: { guess: string }) {
  return (
    <div className={styles.guessRow} aria-label={`${guess} pending`}>
      {guess.split('').map((letter, index) => (
        <span key={`${index}-${letter}`} data-pending="true">{letter}</span>
      ))}
    </div>
  )
}

interface DraftGuessRowProps {
  disabled: boolean
  value: string
  onChange: (value: string) => void
}

function DraftGuessRow({
  disabled,
  value,
  onChange,
}: DraftGuessRowProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const letters = Array.from({ length: WORD_LENGTH }, (_, index) => value[index] ?? '')

  useEffect(() => {
    if (!disabled && !value) inputRefs.current[0]?.focus()
  }, [disabled, value])

  const updateLetter = (index: number, letter: string) => {
    const nextLetter = letter.replace(/[^a-z]/gi, '').slice(-1).toUpperCase()
    onChange(`${value.slice(0, index)}${nextLetter}`)
    if (nextLetter && index < WORD_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !letters[index] && index > 0) {
      event.preventDefault()
      onChange(value.slice(0, index - 1))
      inputRefs.current[index - 1]?.focus()
    }

    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < WORD_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedGuess = normalizeGuess(event.clipboardData.getData('text'))
    if (!isValidGuess(pastedGuess)) return
    event.preventDefault()
    onChange(pastedGuess)
    inputRefs.current[WORD_LENGTH - 1]?.focus()
  }

  return (
    <div className={styles.guessRow} aria-label="Five-letter guess">
      {letters.map((letter, index) => (
        <input
          key={index}
          ref={(element) => { inputRefs.current[index] = element }}
          form="gameplay-guess-form"
          value={letter}
          maxLength={1}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label={`Guess letter ${index + 1}`}
          disabled={disabled}
          onChange={({ target }) => updateLetter(index, target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}

export function GameplayScreen() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const roomCode = normalizeRoomCode(code)
  const [guess, setGuess] = useState('')
  const [pendingGuess, setPendingGuess] = useState<string | null>(null)
  const [lockedGuess, setLockedGuess] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const connect = useRoomStore(({ connect }) => connect)
  const disconnect = useRoomStore(({ disconnect }) => disconnect)
  const status = useRoomStore(({ status }) => status)
  const room = useRoomStore(({ room }) => room)
  const selfId = useRoomStore(({ selfId }) => selfId)
  const match = useRoomStore(({ match }) => match)
  const error = useRoomStore(({ error }) => error)
  const submitGuess = useRoomStore(({ submitGuess }) => submitGuess)
  const returnToLobby = useRoomStore(({ returnToLobby }) => returnToLobby)
  const self = room?.players.find(({ id }) => id === selfId)
  const selfMatch = match?.players.find(({ playerId }) => playerId === selfId)
  const submitted = selfMatch?.submitted ?? false
  const terminal = match?.phase === 'finished' || match?.phase === 'tiebreak'
  const lastAcceptedGuess = selfMatch?.guesses.at(-1)?.word

  useEffect(() => {
    connect(roomCode)
    return disconnect
  }, [connect, disconnect, roomCode])

  useEffect(() => {
    if (!match?.roundEndsAt) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [match?.roundEndsAt])

  useEffect(() => {
    if (room?.phase === 'lobby') navigate(`/room/${roomCode}`, { replace: true })
  }, [navigate, room?.phase, roomCode])

  useEffect(() => {
    if (!pendingGuess) return
    if (lastAcceptedGuess !== pendingGuess && !(match?.mode === 'sync' && submitted)) return
    if (match?.mode === 'sync') setLockedGuess(pendingGuess)
    setGuess('')
    setPendingGuess(null)
  }, [lastAcceptedGuess, match?.mode, pendingGuess, submitted])

  useEffect(() => {
    if (error) setPendingGuess(null)
  }, [error])

  useEffect(() => {
    setLockedGuess(null)
  }, [match?.round])

  const secondsRemaining = match?.roundEndsAt
    ? Math.max(0, Math.ceil((match.roundEndsAt - now) / 1_000))
    : null
  const winner = room?.players.find(({ id }) => id === match?.winnerId)
  const tiebreakNames = useMemo(() => room?.players
    .filter(({ id }) => match?.tiebreakPlayerIds.includes(id))
    .map(({ name }) => name) ?? [], [match?.tiebreakPlayerIds, room?.players])
  const orderedMatchPlayers = useMemo(() => match?.players
    .map((player, index) => ({ player, index }))
    .sort((left, right) => {
      if (left.player.playerId === selfId) return -1
      if (right.player.playerId === selfId) return 1
      return left.index - right.index
    })
    .map(({ player }) => player) ?? [], [match?.players, selfId])

  if (!isValidRoomCode(roomCode)) return <Navigate to="/setup" replace />

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const normalized = normalizeGuess(guess)
    if (!isValidGuess(normalized) || pendingGuess || submitted || terminal) return
    setPendingGuess(normalized)
    submitGuess(normalized)
  }

  return (
    <div className={`app-stage ${styles.gameplayScreen}`}>
      <main className={`app-stage__inner ${styles.game}`}>
        <header className={styles.header}>
          <div>
            <div className="card-kicker">Room {roomCode}</div>
            <h1>{match?.mode === 'sync' ? 'Synchronous clash' : 'Real-time clash'}</h1>
          </div>
          {match && <Tag tone="accent">ROUND {match.round}</Tag>}
        </header>

        {!match && <div className="card">{status === 'terminal' ? 'Match unavailable' : 'Loading match…'}</div>}

        {match && room && (
          <>
            <section className={styles.players} aria-label="Player boards">
              {orderedMatchPlayers.map((matchPlayer) => {
                const player = room.players.find(({ id }) => id === matchPlayer.playerId)
                if (!player) return null
                const isSelf = player.id === selfId
                const inputDisabled = Boolean(
                  pendingGuess ||
                  submitted ||
                  selfMatch?.eliminated ||
                  secondsRemaining === 0,
                )
                const showDraft = isSelf && !terminal && !submitted
                const showLockedGuess = isSelf && submitted && lockedGuess
                const reservedRows = showDraft || showLockedGuess ? 1 : 0
                const emptyRows = Math.max(
                  0,
                  match.maxGuesses - matchPlayer.guesses.length - reservedRows,
                )

                return (
                  <article
                    key={player.id}
                    className="card"
                    data-self={isSelf}
                  >
                    <div className={styles.playerHeader}>
                      <Avatar
                        avatarId={player.avatarId}
                        animalId={player.animalId}
                        size="lobby"
                      />
                      <strong>{player.name}</strong>
                      {matchPlayer.eliminated && <Tag tone="danger">OUT</Tag>}
                      {matchPlayer.submitted && <Tag tone="accent">LOCKED</Tag>}
                    </div>
                    <div className={styles.board}>
                      {matchPlayer.guesses.map((entry, index) => (
                        <GuessRow key={`${index}-${entry.word}`} guess={entry} />
                      ))}
                      {showDraft && (
                        <DraftGuessRow
                          value={guess}
                          disabled={inputDisabled}
                          onChange={setGuess}
                        />
                      )}
                      {showLockedGuess && <PendingGuessRow guess={lockedGuess} />}
                      {Array.from({ length: emptyRows }, (_, index) => (
                        <EmptyRow key={`empty-${index}`} />
                      ))}
                    </div>
                  </article>
                )
              })}
            </section>

            {!terminal && (
              <form
                id="gameplay-guess-form"
                className={styles.guessForm}
                onSubmit={handleSubmit}
              >
                {secondsRemaining !== null && (
                  <div className={styles.timer} role="timer">
                    {submitted ? 'Guess locked' : `${secondsRemaining}s remaining`}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={
                    !isValidGuess(guess) ||
                    Boolean(pendingGuess) ||
                    submitted ||
                    selfMatch?.eliminated ||
                    secondsRemaining === 0
                  }
                >
                  {submitted
                    ? 'Waiting for players…'
                    : pendingGuess
                      ? 'Checking…'
                      : 'Submit guess'}
                </Button>
              </form>
            )}

            {terminal && (
              <section className={`card ${styles.results}`}>
                <div className="card-kicker">Match complete</div>
                <h2>
                  {winner
                    ? `${winner.name} wins!`
                    : match.phase === 'tiebreak'
                      ? 'Dance-off required'
                      : 'No winner this time'}
                </h2>
                {tiebreakNames.length > 0 && <p>{tiebreakNames.join(' vs ')}</p>}
                {match.answer && <p>The word was <strong>{match.answer}</strong>.</p>}
                <Button
                  variant="secondary"
                  disabled={!self?.isHost}
                  onClick={returnToLobby}
                >
                  {self?.isHost
                    ? 'Return to Lobby'
                    : 'Waiting for host…'}
                </Button>
              </section>
            )}

            {error && <div className={styles.error} role="alert">{error.message}</div>}
          </>
        )}
      </main>
    </div>
  )
}
