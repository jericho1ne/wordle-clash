/**
 * Story 08-02 — offline beat map generator.
 *
 * Decodes an audio file to mono PCM via ffmpeg and scans for exactly three
 * independent waveform-spike types, one per lane — a kick band (~<150Hz ->
 * down), a snare/mid band (~150-1000Hz -> left), and a hi-hat/broadband
 * band (~>1000Hz -> right) — via energy-flux peak-picking per band, and
 * writes a schema-valid Beatmap JSON. Each band maps straight to its own
 * lane; there's no alternation to reason about.
 *
 * Run once per track; the output is checked into the repo, not regenerated
 * at build/deploy time — see docs/stories/08-beatmap-engine/00-beatmap-engine-plan.md.
 *
 * Usage: node scripts/generate-beatmap.ts [--input <mp3>] [--out <json>] [--rate <notes/sec>]
 * Requires ffmpeg on PATH.
 */

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Imported by relative path (not the `@wordle-clash/shared` package specifier)
// because this script runs under Node's native TS type-stripping, which
// doesn't perform the .js->.ts remapping the bundler-based apps rely on.
import {
  assertValidBeatmap,
  BEATMAP_MIN_GAP_MS,
} from '../../../packages/shared/src/beatmap.ts'
import type {
  Beatmap,
  BeatmapEntry,
  Lane,
} from '../../../packages/shared/src/beatmap.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../..')

const SAMPLE_RATE = 22_050
const KICK_CUTOFF_HZ = 150
const SNARE_CUTOFF_HZ = 1000
const FRAME_SIZE = 512
const HOP_SIZE = 256
const DEFAULT_TARGET_NOTES_PER_SEC = 4

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg?.startsWith('--')) {
      args.set(arg.slice(2), argv[i + 1] ?? '')
      i += 1
    }
  }
  return args
}

function decodeToMonoPcm(inputPath: string, sampleRate: number): Float32Array {
  const buffer = execFileSync('ffmpeg', [
    '-i',
    inputPath,
    '-f',
    'f32le',
    '-ar',
    String(sampleRate),
    '-ac',
    '1',
    '-loglevel',
    'error',
    'pipe:1',
  ], { maxBuffer: 1024 * 1024 * 256 })
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4)
}

/** Single-pole IIR low-pass — cheap, good enough to isolate a kick's low-frequency thump. */
function lowPass(samples: Float32Array, sampleRate: number, cutoffHz: number): Float32Array {
  const rc = 1 / (2 * Math.PI * cutoffHz)
  const dt = 1 / sampleRate
  const alpha = dt / (rc + dt)
  const out = new Float32Array(samples.length)
  let prev = 0
  for (let i = 0; i < samples.length; i += 1) {
    prev += alpha * ((samples[i] ?? 0) - prev)
    out[i] = prev
  }
  return out
}

/** Single-pole IIR high-pass (complement of lowPass) — isolates snare/broadband content. */
function highPass(samples: Float32Array, sampleRate: number, cutoffHz: number): Float32Array {
  const low = lowPass(samples, sampleRate, cutoffHz)
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = (samples[i] ?? 0) - (low[i] ?? 0)
  }
  return out
}

/** RMS energy per frame, hopped across the signal. */
function frameEnergies(samples: Float32Array, frameSize: number, hopSize: number): Float32Array {
  const frameCount = Math.max(0, Math.floor((samples.length - frameSize) / hopSize) + 1)
  const energies = new Float32Array(frameCount)
  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hopSize
    let sumSq = 0
    for (let i = 0; i < frameSize; i += 1) {
      const s = samples[start + i] ?? 0
      sumSq += s * s
    }
    energies[frame] = Math.sqrt(sumSq / frameSize)
  }
  return energies
}

interface OnsetCandidate {
  timeMs: number
  strength: number
}

/**
 * Peak-picks onsets from a frame-energy envelope: a frame is an onset when
 * its positive energy flux (rise over the previous frame) exceeds an
 * adaptive threshold (rolling mean + sensitivity * rolling stddev), is a
 * local maximum, and clears a refractory period so one hit doesn't fire twice.
 */
function detectOnsets(
  energies: Float32Array,
  sampleRate: number,
  hopSize: number,
  opts: { sensitivity?: number, windowFrames?: number, refractoryMs?: number } = {},
): OnsetCandidate[] {
  const sensitivity = opts.sensitivity ?? 1.5
  const windowFrames = opts.windowFrames ?? 43 // ~0.5s at 22050Hz / 256 hop
  const refractoryMs = opts.refractoryMs ?? BEATMAP_MIN_GAP_MS
  const hopMs = (hopSize / sampleRate) * 1000

  const flux = new Float32Array(energies.length)
  for (let i = 1; i < energies.length; i += 1) {
    flux[i] = Math.max(0, (energies[i] ?? 0) - (energies[i - 1] ?? 0))
  }

  const onsets: OnsetCandidate[] = []
  let lastOnsetFrame = -Infinity
  for (let i = 1; i < flux.length - 1; i += 1) {
    const windowStart = Math.max(0, i - windowFrames)
    const window = flux.slice(windowStart, i)
    const mean = window.reduce((sum, v) => sum + v, 0) / Math.max(1, window.length)
    const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / Math.max(1, window.length)
    const threshold = mean + sensitivity * Math.sqrt(variance)

    const current = flux[i] ?? 0
    const isLocalMax = current >= (flux[i - 1] ?? 0) && current >= (flux[i + 1] ?? 0)
    const msSinceLast = (i - lastOnsetFrame) * hopMs
    if (current > threshold && current > 0 && isLocalMax && msSinceLast >= refractoryMs) {
      onsets.push({ timeMs: Math.round(i * hopMs), strength: current })
      lastOnsetFrame = i
    }
  }
  return onsets
}

/** Every onset from a single band goes to that band's one fixed lane. */
function assignLane(onsets: OnsetCandidate[], lane: Lane): BeatmapEntry[] {
  return onsets.map((onset) => ({ timeMs: onset.timeMs, lane }))
}

/** Global debounce + density cap across the merged, sorted onset list. */
function mergeAndThrottle(
  entries: BeatmapEntry[],
  minGapMs: number,
  targetNotesPerSec: number,
): BeatmapEntry[] {
  const sorted = [...entries].sort((a, b) => a.timeMs - b.timeMs)
  const kept: BeatmapEntry[] = []
  const recentWindowMs = 1000
  for (const entry of sorted) {
    const last = kept[kept.length - 1]
    if (last && entry.timeMs - last.timeMs < minGapMs) continue
    const recentCount = kept.filter((k) => entry.timeMs - k.timeMs < recentWindowMs).length
    if (recentCount >= targetNotesPerSec) continue
    kept.push(entry)
  }
  return kept
}

export function generateBeatmap(inputPath: string, targetNotesPerSec: number): Beatmap {
  const samples = decodeToMonoPcm(inputPath, SAMPLE_RATE)
  const durationMs = Math.round((samples.length / SAMPLE_RATE) * 1000)

  // Three independent bands, each feeding exactly one lane — no alternation.
  const kickBand = lowPass(samples, SAMPLE_RATE, KICK_CUTOFF_HZ)
  const aboveKick = highPass(samples, SAMPLE_RATE, KICK_CUTOFF_HZ)
  const snareBand = lowPass(aboveKick, SAMPLE_RATE, SNARE_CUTOFF_HZ)
  const hiBand = highPass(aboveKick, SAMPLE_RATE, SNARE_CUTOFF_HZ)

  const kickOnsets = detectOnsets(frameEnergies(kickBand, FRAME_SIZE, HOP_SIZE), SAMPLE_RATE, HOP_SIZE)
  const snareOnsets = detectOnsets(frameEnergies(snareBand, FRAME_SIZE, HOP_SIZE), SAMPLE_RATE, HOP_SIZE)
  const hiOnsets = detectOnsets(frameEnergies(hiBand, FRAME_SIZE, HOP_SIZE), SAMPLE_RATE, HOP_SIZE)

  const kickEntries = assignLane(kickOnsets, 'down')
  const snareEntries = assignLane(snareOnsets, 'left')
  const hiEntries = assignLane(hiOnsets, 'right')

  const entries = mergeAndThrottle(
    [...kickEntries, ...snareEntries, ...hiEntries],
    BEATMAP_MIN_GAP_MS,
    targetNotesPerSec,
  )

  return {
    trackPath: `audio/${path.basename(inputPath)}`,
    durationMs,
    entries,
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = path.resolve(REPO_ROOT, args.get('input') ?? 'apps/web/public/audio/canto-de-ossanha.mp3')
  const outputPath = path.resolve(REPO_ROOT, args.get('out') ?? 'apps/web/public/audio/canto-de-ossanha.beatmap.json')
  const targetNotesPerSec = Number(args.get('rate') ?? DEFAULT_TARGET_NOTES_PER_SEC)

  if (!existsSync(inputPath)) {
    console.error(`Input audio file not found: ${inputPath}`)
    process.exit(1)
  }

  console.log(`Decoding ${inputPath}...`)
  const beatmap = generateBeatmap(inputPath, targetNotesPerSec)
  assertValidBeatmap(beatmap)

  writeFileSync(outputPath, `${JSON.stringify(beatmap, null, 2)}\n`)
  const notesPerSec = beatmap.entries.length / (beatmap.durationMs / 1000)
  console.log(`Wrote ${beatmap.entries.length} entries (${notesPerSec.toFixed(2)} notes/sec avg) to ${outputPath}`)
}

main()
