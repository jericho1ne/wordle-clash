/** Default value for `<PlaybackSpeedSlider>` wherever beat-map audio/gameplay speed is adjustable. */
export const DEFAULT_PLAYBACK_RATE = 0.8

// --- Tiebreaker dance-off feel ---
// Timing windows that decide scoring live in packages/shared/src/dance-off.ts
// (CORRECT_TIME_WINDOWS) since the server needs them too. Everything below
// is purely how the dance-off looks and feels in the browser.

/** Fractal tint (hue only) when a hit lands in any scoring tier. Adjust FRACTAL_FLASH_BRIGHTNESS to dim/brighten, not these values. */
export const FRACTAL_FLASH_COLOR_CORRECT: [number, number, number] = [0.3, 1.0, 0.4]

/** Fractal tint (hue only) when a hit misses every tier. Adjust FRACTAL_FLASH_BRIGHTNESS to dim/brighten, not these values. */
export const FRACTAL_FLASH_COLOR_MISS: [number, number, number] = [1.0, 0.25, 0.25]

/** How bright the flash colors above are, independent of their hue. 1 = as defined, 0.5 = half as bright, 2 = twice as bright. */
export const FRACTAL_FLASH_BRIGHTNESS = 1.0

/** How dim the fractal sits at rest (before any beat/flash brightens it). Lower = darker. */
export const FRACTAL_BASE_BRIGHTNESS = 0.5

/** How colorful the fractal sits at rest. 1 = full color, 0 = grayscale. */
export const FRACTAL_BASE_SATURATION = 0.6

/** How long (ms) a lane's hit-line flash and the fractal's color flash both last. */
export const HIT_FLASH_MS = 120

/** How far ahead (ms) upcoming notes become visible on the real gameplay canvases. */
export const DANCE_FLOOR_LOOKAHEAD_MS = 1800

/** How far ahead (ms) upcoming notes become visible on the /beatmap-preview scrub tool (wider, since it's just for scrubbing, not play). */
export const BEATMAP_PREVIEW_LOOKAHEAD_MS = 2200

/** How long (ms) past the hit line a note keeps rendering on the real gameplay canvases before it's dropped. */
export const DANCE_FLOOR_NOTE_TRAIL_MS = 160

/** The playground's mock tied word when no `?word=` is given, matching this repo's usual deterministic test answer. */
export const DEFAULT_MOCK_WORD = 'CLASH'
