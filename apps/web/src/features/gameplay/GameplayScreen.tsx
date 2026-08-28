import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
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

import { LobbyMusic } from '../lobby/LobbyMusic'
import { useRoomStore } from '../../realtime'
import {
  Avatar,
  Button,
  Input,
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

export function GameplayScreen() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const roomCode = normalizeRoomCode(code)
  const [guess, setGuess] = useState('')
  const [now, setNow] = useState(Date.now())
  const connect = useRoomStore(({ connect }) => connect)
  const disconnect = useRoomStore(({ disconnect }) => disconnect)
  const status = useRoomStore(({ status }) => status)
  const room = useRoomStore(({ room }) => room)
  const selfId = useRoomStore(({ selfId }) => selfId)
  const match = useRoomStore(({ match }) => match)
  const error = useRoomStore(({ error }) => error)
  const submitGuess = useRoomStore(({ submitGuess }) => submitGuess)
  const selfMatch = match?.players.find(({ playerId }) => playerId === selfId)
  const submitted = selfMatch?.submitted ?? false
  const terminal = match?.phase === 'finished' || match?.phase === 'tiebreak'

  useEffect(() => {
    connect(roomCode)
    return disconnect
  }, [connect, disconnect, roomCode])

  useEffect(() => {
    if (!match?.roundEndsAt) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [match?.roundEndsAt])

  const secondsRemaining = match?.roundEndsAt
    ? Math.max(0, Math.ceil((match.roundEndsAt - now) / 1_000))
    : null
  const winner = room?.players.find(({ id }) => id === match?.winnerId)
  const tiebreakNames = useMemo(() => room?.players
    .filter(({ id }) => match?.tiebreakPlayerIds.includes(id))
    .map(({ name }) => name) ?? [], [match?.tiebreakPlayerIds, room?.players])

  if (!isValidRoomCode(roomCode)) return <Navigate to="/setup" replace />

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const normalized = normalizeGuess(guess)
    if (!isValidGuess(normalized) || submitted || terminal) return
    submitGuess(normalized)
    setGuess('')
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
              {match.players.map((matchPlayer) => {
                const player = room.players.find(({ id }) => id === matchPlayer.playerId)
                if (!player) return null
                const emptyRows = Math.max(0, match.maxGuesses - matchPlayer.guesses.length)

                return (
                  <article
                    key={player.id}
                    className="card"
                    data-self={player.id === selfId}
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
                      {Array.from({ length: emptyRows }, (_, index) => (
                        <EmptyRow key={`empty-${index}`} />
                      ))}
                    </div>
                  </article>
                )
              })}
            </section>

            {!terminal && (
              <form className={styles.guessForm} onSubmit={handleSubmit}>
                {secondsRemaining !== null && (
                  <div className={styles.timer} role="timer">
                    {submitted ? 'Guess locked' : `${secondsRemaining}s remaining`}
                  </div>
                )}
                <Input
                  value={guess}
                  minLength={WORD_LENGTH}
                  maxLength={WORD_LENGTH}
                  pattern="[A-Za-z]{5}"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Five-letter guess"
                  placeholder="TYPE FIVE LETTERS"
                  disabled={submitted || selfMatch?.eliminated || secondsRemaining === 0}
                  onChange={({ target }) => setGuess(
                    target.value.replace(/[^a-z]/gi, '').toUpperCase(),
                  )}
                />
                <Button
                  type="submit"
                  disabled={
                    !isValidGuess(guess) ||
                    submitted ||
                    selfMatch?.eliminated ||
                    secondsRemaining === 0
                  }
                >
                  {submitted ? 'Waiting for players…' : 'Submit guess'}
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
                <Button variant="secondary" onClick={() => navigate('/setup')}>
                  Back to setup
                </Button>
              </section>
            )}

            {error && <div className={styles.error} role="alert">{error.message}</div>}
          </>
        )}
      </main>
      <LobbyMusic />
    </div>
  )
}
