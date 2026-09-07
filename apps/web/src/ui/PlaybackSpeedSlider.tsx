import styles from './PlaybackSpeedSlider.module.scss'

export interface PlaybackSpeedSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  id?: string
}

const DEFAULT_MIN = 0.25
const DEFAULT_MAX = 1
const DEFAULT_STEP = 0.05

/** A labelled 0-1 range control showing the current value as a percentage. Used to slow down beat-map playback. */
export function PlaybackSpeedSlider({
  value,
  onChange,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  disabled = false,
  id = 'playback-speed',
}: PlaybackSpeedSliderProps) {
  return (
    <div className={styles.playbackSpeedSlider}>
      <label htmlFor={id}>Speed {Math.round(value * 100)}%</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
