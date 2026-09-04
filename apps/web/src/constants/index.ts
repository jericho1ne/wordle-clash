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

/** How much the fractal appears to zoom in on a correct hit. Higher = bigger jump in size. */
export const FRACTAL_SIZE_INCREASE = 0.15

/** How much faster the fractal spins while a dance-off is actively playing, vs. its idle default. Multiplied by the chosen playback speed. */
export const FRACTAL_SPIN_MULTIPLIER_PLAYING = 6

/** How far ahead (ms) upcoming notes become visible on the real gameplay canvases. */
export const DANCE_FLOOR_LOOKAHEAD_MS = 1800

/** How far ahead (ms) upcoming notes become visible on the /beatmap-preview scrub tool (wider, since it's just for scrubbing, not play). */
export const BEATMAP_PREVIEW_LOOKAHEAD_MS = 2200

/** Opacity of a note when it first appears at the top of the board. */
export const NOTE_FADE_IN_OPACITY = 0.2

/** Opacity of a note right at the keystroke window (its brightest point). */
export const NOTE_HITLINE_OPACITY = 1.0

/** Opacity a note quickly fades down to right before it runs off the bottom of the board. */
export const NOTE_FADE_OUT_OPACITY = 0.0

/** How much of the board's height (as a fraction, from the bottom) the quick fade-out happens over. */
export const NOTE_FADE_OUT_ZONE = 0.08

/** Pixel height of the white hit-line box at the bottom of each lane, on the real gameplay canvases. */
export const KEYSTROKE_WINDOW = 40

/** Line width (px) of the hit-line box's outline, at rest (not flashing). */
export const KEYSTROKE_WINDOW_OUTLINE = 2

/** Opacity (0-1) of the hit-line box's outline, at rest (not flashing). */
export const KEYSTROKE_WINDOW_OPACITY = 0.25

/** The playground's mock tied word when no `?word=` is given, matching this repo's usual deterministic test answer. */
export const DEFAULT_MOCK_WORD = 'CLASH'
