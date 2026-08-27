/**
 * Avatar palette. One entry per player colour; `avatarId` throughout the app is
 * an index into this array (0..4). Each entry maps to Ember CSS custom
 * properties (see `apps/web/src/styles/ember.css`); the UI reads `bg` / `text`
 * straight through and never hard-codes a colour.
 *
 * The five slots deliberately span the five palette families (Pearl Aqua,
 * Pumpkin Spice, Cool Steel, Mahogany Red, plus a light aqua) so players in a
 * lobby are easy to tell apart at a glance.
 */
export interface AvatarStep {
  /** Human label for the colour (not shown in UI; aids debugging). */
  readonly name: string;
  /** CSS value for the avatar circle background. */
  readonly bg: string;
  /** CSS value for the initial/text on that background. */
  readonly text: string;
}

export const AVATAR_STEPS: readonly AvatarStep[] = [
  { name: 'aqua', bg: 'var(--color-accent-500)', text: 'var(--color-accent-900)' },
  { name: 'pumpkin', bg: 'var(--color-accent-2-500)', text: 'var(--color-accent-2-900)' },
  { name: 'steel', bg: 'var(--color-neutral-400)', text: 'var(--color-neutral-900)' },
  { name: 'mahogany', bg: 'var(--color-danger-600)', text: 'var(--color-danger-100)' },
  { name: 'mist', bg: 'var(--color-accent-300)', text: 'var(--color-accent-900)' },
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
