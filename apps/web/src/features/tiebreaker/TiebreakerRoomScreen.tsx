import type { Lane } from '@wordle-clash/shared'
import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Navigate,
  useParams,
} from 'react-router'
import { FRACTAL_SPIN_MULTIPLIER_PLAYING } from '@/constants'
import { useAppNavigate } from '@/lib/useAppNavigate'
import { useRoomStore } from '@/realtime'
import { Button } from '@/ui'
import { AudioCountdown } from './AudioCountdown'
import { DanceBoard } from './DanceBoard'
import { DanceOffResultDialog } from './DanceOffResultDialog'
import { scoreStandings } from './scoreStandings'
import type { TiebreakerStageHandle } from './TiebreakerStage'
import { TiebreakerStage } from './TiebreakerStage'
import { useDanceAudio } from './useDanceAudio'
import { LETTER_KEYS } from './useDanceInput'
import styles from './TiebreakerRoomScreen.module.scss'

export function TiebreakerRoomScreen() {
  const { code = '' } = useParams()
  const navigate = useAppNavigate()
  const roomCode = normalizeRoomCode(code)
  const stageRef = useRef<TiebreakerStageHandle | null>(null)
  const { audioRef, play, pause } = useDanceAudio()
  const [audioBlocked, setAudioBlocked] = useState(false)

  const connect = useRoomStore(({ connect }) => connect)
  const disconnect = useRoomStore(({ disconnect }) => disconnect)
  const room = useRoomStore(({ room }) => room)
  const selfId = useRoomStore(({ selfId }) => selfId)
  const match = useRoomStore(({ match }) => match)
  const danceOff = useRoomStore(({ danceOff }) => danceOff)
  const danceOffHit = useRoomStore(({ danceOffHit }) => danceOffHit)
  const submitDanceHit = useRoomStore(({ submitDanceHit }) => submitDanceHit)
  const returnToLobby = useRoomStore(({ returnToLobby }) => returnToLobby)

  useEffect(() => {
    connect(roomCode)
    return disconnect
  }, [connect, disconnect, roomCode])

  useEffect(() => {
    if (!match) return
    // A tiebreak-finished match keeps its origin in tiebreakPlayerIds, so the
    // winner banner stays visible here instead of bouncing back to /play.
    const cameFromTiebreak = match.phase === 'tiebreak' || match.tiebreakPlayerIds.length > 0
    if (!cameFromTiebreak) navigate(`/room/${roomCode}/play`, { replace: true })
  }, [match, navigate, roomCode])

  // The server is the only judge of a hit — this flashes the shared
  // fractal once it says so, for whichever player it was about.
  useEffect(() => {
    if (!danceOffHit) return
    stageRef.current?.flash(danceOffHit.judgment === 'miss' ? 'miss' : 'correct')
  }, [danceOffHit])

  const startsAt = danceOff?.startsAt
  const trackPath = danceOff?.beatmap.trackPath
  const running = startsAt !== undefined && match?.phase !== 'finished'
  const clockMs = useCallback(() => startsAt === undefined ? 0 : Date.now() - startsAt, [startsAt])

  useEffect(() => {
    stageRef.current?.setSpinSpeed(running ? FRACTAL_SPIN_MULTIPLIER_PLAYING : 1)
  }, [running])

  useEffect(() => {
    if (!running || !trackPath) return
    let cancelled = false
    play(clockMs() / 1000).then(
      () => { if (!cancelled) setAudioBlocked(false) },
      () => { if (!cancelled) setAudioBlocked(true) },
    )
    return () => {
      cancelled = true
      pause()
    }
  }, [running, trackPath, clockMs, play, pause])

  async function resumeAudio() {
    try {
      await play(clockMs() / 1000)
      setAudioBlocked(false)
    } catch {
      setAudioBlocked(true)
    }
  }

  const handleHit = useCallback((lane: Lane, clientTimeMs: number) => {
    submitDanceHit(lane, clientTimeMs)
  }, [submitDanceHit])

  if (!isValidRoomCode(roomCode)) return <Navigate to="/setup" replace />

  const dancerIds = danceOff?.playerIds ?? match?.tiebreakPlayerIds ?? []
  const isDancer = !!selfId && dancerIds.includes(selfId)
  const battleOver = match?.phase === 'finished'
  const [leftId, rightId] = dancerIds
  const leftPlayer = room?.players.find(({ id }) => id === leftId)
  const rightPlayer = room?.players.find(({ id }) => id === rightId)
  const winnerSide = match?.winnerId === leftId ? 'left' : match?.winnerId === rightId ? 'right' : null
  const standings = scoreStandings(danceOff?.scores ?? {}, dancerIds)

  return (
    <TiebreakerStage ref={stageRef} roomLabel={`Room ${roomCode}`} word={match?.answer ?? null} className={styles.tiebreakerRoomScreen}>
      <audio ref={audioRef} src={trackPath ? `/${trackPath}` : undefined} className={styles.audio} onPause={() => console.warn('>>> Music Paused')} />
      {!danceOff && <div className="card">Waiting for the dance-off to start…</div>}

      {danceOff && (
        <>
          {audioBlocked && running && <Button onClick={resumeAudio}>Enable music</Button>}
          <AudioCountdown audioRef={audioRef} />

          {!isDancer && !battleOver && (
            <p className={styles.spectatorNote}>You&apos;re spectating — {dancerIds.length} players are battling it out.</p>
          )}

          <div className={styles.floors}>
            {dancerIds.map((playerId) => {
              const player = room?.players.find(({ id }) => id === playerId)
              return (
                <DanceBoard
                  key={`${danceOff.startsAt}-${playerId}`}
                  name={player?.name ?? 'Dancer'}
                  playerColorId={player?.playerColorId ?? 0}
                  score={danceOff.scores[playerId] ?? 0}
                  entries={danceOff.beatmap.entries}
                  clockMs={clockMs}
                  keyToLane={LETTER_KEYS}
                  highestScore={standings.highest}
                  isLeader={standings.leaderId === playerId}
                  canPlay={!battleOver && playerId === selfId}
                  onHit={handleHit}
                />
              )
            })}
          </div>

          {battleOver && (
            <DanceOffResultDialog
              open
              onOpenChange={() => {}}
              left={{ name: leftPlayer?.name ?? 'Dancer', score: leftId ? danceOff.scores[leftId] ?? 0 : 0 }}
              right={{ name: rightPlayer?.name ?? 'Dancer', score: rightId ? danceOff.scores[rightId] ?? 0 : 0 }}
              winnerSide={winnerSide}
              actions={(
                <Button
                  appearance="secondary"
                  disabled={!room?.players.find(({ id }) => id === selfId)?.isHost}
                  onClick={returnToLobby}
                >
                  Return to lobby
                </Button>
              )}
            />
          )}
        </>
      )}
    </TiebreakerStage>
  )
}
