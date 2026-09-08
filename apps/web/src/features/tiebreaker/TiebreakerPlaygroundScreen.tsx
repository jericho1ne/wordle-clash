import type {
  BeatmapEntry,
  Lane,
  Beatmap,
} from '@wordle-clash/shared'
import {
  DANCE_OFF_POINTS,
  judgeSubmittedHit,
  parseCompactBeatmap,
} from '@wordle-clash/shared'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router'
import {
  DEFAULT_MOCK_WORD,
  DEFAULT_PLAYBACK_RATE,
  FRACTAL_SPIN_MULTIPLIER_PLAYING,
} from '@/constants'
import {
  Button,
  DialogBox,
  PlaybackSpeedSlider,
} from '@/ui'
import { AudioCountdown } from './AudioCountdown'
import { DanceBoard } from './DanceBoard'
import { DanceOffResultDialog } from './DanceOffResultDialog'
import { scoreStandings } from './scoreStandings'
import type { TiebreakerStageHandle } from './TiebreakerStage'
import { TiebreakerStage } from './TiebreakerStage'
import { useDanceAudio } from './useDanceAudio'
import {
  LETTER_KEYS,
  ARROW_KEYS,
} from './useDanceInput'
import styles from './TiebreakerPlaygroundScreen.module.scss'

const BEATMAP_SRC = '/audio/canto-de-ossanha.beatmap.json'
const DANCERS = [
  { id: 'p1', name: 'Player 1', playerColorId: 0, keyToLane: LETTER_KEYS },
  { id: 'p2', name: 'Player 2', playerColorId: 1, keyToLane: ARROW_KEYS },
]
type BattlePhase = 'idle' | 'running' | 'ended'

export function TiebreakerPlaygroundScreen() {
  const [searchParams] = useSearchParams()
  const word = searchParams.get('word') ?? DEFAULT_MOCK_WORD
  const { audioRef, play, pause, clockMs } = useDanceAudio()
  const consumed = useRef<Record<string, Set<BeatmapEntry>>>({ p1: new Set(), p2: new Set() })
  const [combos, setCombos] = useState<Record<string, number>>({ p1: 0, p2: 0 })
  const stageRef = useRef<TiebreakerStageHandle | null>(null)
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<BattlePhase>('idle')
  const [round, setRound] = useState(0)
  const [starting, setStarting] = useState(false)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(true)
  const [scores, setScores] = useState<Record<string, number>>({ p1: 0, p2: 0 })
  const [playbackRate, setPlaybackRate] = useState(DEFAULT_PLAYBACK_RATE)

  useEffect(() => {
    fetch(BEATMAP_SRC)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json()
      })
      .then((data: unknown) => setBeatmap(parseCompactBeatmap(data)))
      .catch((err: Error) => setError(err.message))
  }, [])

  const handleHit = useCallback((id: string, lane: Lane, timeMs: number) => {
    const used = consumed.current[id]!
    const available = (beatmap?.entries ?? []).filter((entry) => !used.has(entry))
    const { judgment, matchedEntry } = judgeSubmittedHit(available, lane, timeMs)
    if (matchedEntry) used.add(matchedEntry)
    setScores((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + DANCE_OFF_POINTS[judgment] }))
    setCombos((prev) => ({ ...prev, [id]: judgment === 'miss' ? 0 : (prev[id] ?? 0) + 1 }))
    const strength = judgment === 'miss' ? 1 : 0.6 + (DANCE_OFF_POINTS[judgment] / 5) * 0.8
    stageRef.current?.flash(judgment === 'miss' ? 'miss' : 'correct', strength)
  }, [beatmap])

  async function startBattle() {
    setStarting(true)
    try {
      await play(0, playbackRate)
      consumed.current = { p1: new Set(), p2: new Set() }
      setScores({ p1: 0, p2: 0 })
      setCombos({ p1: 0, p2: 0 })
      setRound((previous) => previous + 1)
      setError(null)
      setPhase('running')
      setIsStartDialogOpen(false)
      stageRef.current?.setSpinSpeed(FRACTAL_SPIN_MULTIPLIER_PLAYING * playbackRate)
    } catch {
      setError('Unable to play the song. Try starting again.')
    } finally {
      setStarting(false)
    }
  }

  function finishBattle() {
    setPhase('ended')
    pause()
    stageRef.current?.setSpinSpeed(1)
  }

  function prepareNextBattle() {
    setPhase('idle')
    setIsStartDialogOpen(true)
  }

  const scoreP1 = scores.p1 ?? 0
  const scoreP2 = scores.p2 ?? 0
  const standings = scoreStandings(scores, DANCERS.map(({ id }) => id))
  const winnerSide = phase === 'ended' && scoreP1 !== scoreP2 ? (scoreP1 > scoreP2 ? 'left' : 'right') : null

  return (
    <TiebreakerStage ref={stageRef} word={word} className={styles.tiebreakerPlaygroundScreen}>
      <audio
        ref={audioRef}
        src={beatmap ? `/${beatmap.trackPath}` : undefined}
        onEnded={finishBattle}
        className={styles.audio}
        onPause={() => console.warn('>>> Music Paused')}
      />

      <DialogBox
        open={isStartDialogOpen}
        title="Ready to dance?"
        alignment="center"
        className={styles.battleDialog}
        onOpenChange={() => {}}
        actions={(
          <Button
            block
            className={styles.startBattle}
            appearance="primary"
            onClick={startBattle}
            disabled={!beatmap || starting}
          >
            Start battle
          </Button>
        )}
      >
        {error && <p className={styles.error} role="alert">{error}</p>}
        <PlaybackSpeedSlider value={playbackRate} onChange={setPlaybackRate} />
      </DialogBox>

      <AudioCountdown audioRef={audioRef} />

      <div className={styles.floors}>
        {DANCERS.map((dancer) => (
          <DanceBoard
            key={`${round}-${dancer.id}`}
            name={dancer.name}
            playerColorId={dancer.playerColorId}
            keyToLane={dancer.keyToLane}
            score={scores[dancer.id] ?? 0}
            combo={combos[dancer.id] ?? 0}
            isConsumed={(entry) => consumed.current[dancer.id]?.has(entry) ?? false}
            variant="playground"
            entries={beatmap?.entries ?? []}
            canPlay={phase === 'running'}
            clockMs={clockMs}
            highestScore={standings.highest}
            isLeader={standings.leaderId === dancer.id}
            onHit={(lane, timeMs) => handleHit(dancer.id, lane, timeMs)}
          />
        ))}
      </div>

      {phase === 'ended' && (
        <DanceOffResultDialog
          open
          onOpenChange={() => {}}
          left={{ name: DANCERS[0]?.name ?? 'Player 1', score: scoreP1 }}
          right={{ name: DANCERS[1]?.name ?? 'Player 2', score: scoreP2 }}
          winnerSide={winnerSide}
          actions={(
            <Button appearance="primary" onClick={prepareNextBattle}>
              Dance again
            </Button>
          )}
        />
      )}
    </TiebreakerStage>
  )
}
