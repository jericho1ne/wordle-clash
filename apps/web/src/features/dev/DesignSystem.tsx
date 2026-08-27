import { useState } from 'react'

import { Button, Field, IconButton, Input, RadioGroup, SegmentedControl } from '../../ui'
import styles from './DesignSystem.module.scss'

const BASE = [
  { key: 'bg', token: '--color-bg', name: 'Coffee Bean', ink: 'light' },
  { key: 'surface', token: '--color-surface', name: 'Surface', ink: 'light' },
  { key: 'text', token: '--color-text', name: 'Text', ink: 'dark' },
  { key: 'accent', token: '--color-accent', name: 'Pearl Aqua', ink: 'dark' },
  { key: 'accent-2', token: '--color-accent-2', name: 'Pumpkin Spice', ink: 'dark' },
  { key: 'neutral', token: '--color-neutral-500', name: 'Cool Steel', ink: 'dark' },
  { key: 'danger', token: '--color-danger-600', name: 'Mahogany Red', ink: 'light' },
] as const

const RAMPS = [
  { key: 'accent', label: 'accent · Pearl Aqua' },
  { key: 'accent-2', label: 'accent-2 · Pumpkin Spice' },
  { key: 'neutral', label: 'neutral · Cool Steel' },
  { key: 'danger', label: 'danger · Mahogany Red' },
] as const

const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

/**
 * Dev-only design-system showcase (route `/design-system`, DEV builds only).
 * A new section is added by each design-system story.
 */
export function DesignSystem() {
  const [mode, setMode] = useState<'sync' | 'realtime'>('sync')
  const [room, setRoom] = useState<'create' | 'join'>('create')

  return (
    <div className={styles.designSystem}>
      <h1>Design System</h1>

      <section className={styles.section}>
        <h2>Palette</h2>

        <h3>Base</h3>
        <div className={styles.pills}>
          {BASE.map((c) => (
            <span key={c.key} className={styles.pill} data-swatch={c.key} data-ink={c.ink}>
              {c.name} <code>{c.token}</code>
            </span>
          ))}
        </div>

        {RAMPS.map((ramp) => (
          <div key={ramp.key}>
            <h3>{ramp.label}</h3>
            <div className={styles.rampStrip}>
              {STEPS.map((step) => (
                <div
                  key={step}
                  className={styles.step}
                  data-swatch={`${ramp.key}-${step}`}
                  data-dark={step >= 500 ? 'true' : 'false'}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2>Button</h2>
        <div className={styles.row}>
          <span className={styles.rowLabel}>default</span>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>disabled</span>
          <Button disabled>Primary</Button>
          <Button variant="secondary" disabled>
            Secondary
          </Button>
          <Button variant="ghost" disabled>
            Ghost
          </Button>
          <Button variant="danger" disabled>
            Danger
          </Button>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>icons</span>
          <Button leadingIcon={<span aria-hidden>+</span>}>New room</Button>
          <Button variant="secondary" trailingIcon={<span aria-hidden>→</span>}>
            Continue
          </Button>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>block</span>
          <div className={styles.block}>
            <Button block>Play</Button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>IconButton</h2>
        <div className={styles.row}>
          <span className={styles.rowLabel}>default</span>
          <IconButton aria-label="Back">‹</IconButton>
          <IconButton variant="secondary" aria-label="Copy">
            ⧉
          </IconButton>
          <IconButton variant="primary" aria-label="Favorite">
            ★
          </IconButton>
          <IconButton variant="danger" aria-label="Delete">
            ✕
          </IconButton>
          <IconButton aria-label="Disabled" disabled>
            ‹
          </IconButton>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Field / Input</h2>
        <div className={styles.stack}>
          <Field label="Your name" htmlFor="ds-name">
            <Input id="ds-name" placeholder="e.g. Nova" maxLength={14} />
          </Field>
          <Field label="Room code" htmlFor="ds-code" hint="4 letters, a dash, 4 digits">
            <Input id="ds-code" placeholder="PLUM-742" autoCapitalize="characters" />
          </Field>
          <Field label="Email" htmlFor="ds-email" error="That doesn’t look like an email">
            <Input id="ds-email" type="email" defaultValue="nope" />
          </Field>
          <Field label="Disabled" htmlFor="ds-disabled">
            <Input id="ds-disabled" placeholder="can’t touch this" disabled />
          </Field>
        </div>
      </section>

      <section className={styles.section}>
        <h2>SegmentedControl</h2>
        <SegmentedControl
          name="ds-mode"
          aria-label="Game mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'sync', label: 'Synchronous' },
            { value: 'realtime', label: 'Real-time' },
          ]}
        />
        <p className={styles.note}>selected: {mode}</p>
      </section>

      <section className={styles.section}>
        <h2>RadioGroup</h2>
        <RadioGroup
          name="ds-room"
          aria-label="Room mode"
          value={room}
          onChange={setRoom}
          options={[
            { value: 'create', label: 'Create room' },
            { value: 'join', label: 'Join room' },
          ]}
        />
        <p className={styles.note}>selected: {room}</p>
      </section>
    </div>
  )
}
