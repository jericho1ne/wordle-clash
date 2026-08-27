/**
 * Avatar palette — ported verbatim from the "Wordle Royale" design prototype
 * (`AVATAR_STEPS`). Each entry maps to Nocturne CSS custom properties; the UI
 * never hard-codes these colors, it reads `bg` / `text` straight through.
 *
 * `avatarId` throughout the app is an index into this array (0..4).
 */
export interface AvatarStep {
  /** Nocturne ramp step the ground is derived from (documentation only). */
  readonly step: number;
  /** CSS value for the avatar circle background. */
  readonly bg: string;
  /** CSS value for the initial/text on that background. */
  readonly text: string;
}

export const AVATAR_STEPS: readonly AvatarStep[] = [
  { step: 500, bg: 'var(--color-accent-500)', text: 'var(--color-accent-100)' },
  { step: 700, bg: 'var(--color-accent-700)', text: 'var(--color-accent-100)' },
  { step: 300, bg: 'var(--color-accent-300)', text: 'var(--color-neutral-900)' },
  { step: 800, bg: 'var(--color-neutral-800)', text: 'var(--color-accent-200)' },
  { step: 600, bg: 'var(--color-neutral-600)', text: 'var(--color-neutral-100)' },
] as const;

export const AVATAR_COUNT = AVATAR_STEPS.length;

/** Clamp an arbitrary number to a valid avatar index. */
export function clampAvatarId(id: number): number {
  if (!Number.isFinite(id)) return 0;
  return Math.min(AVATAR_COUNT - 1, Math.max(0, Math.trunc(id)));
}

export function getAvatarStep(id: number): AvatarStep {
  return AVATAR_STEPS[clampAvatarId(id)]!;
}
