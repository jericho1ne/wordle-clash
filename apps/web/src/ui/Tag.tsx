import type { ReactNode } from 'react';

export type TagTone = 'accent' | 'accent-2' | 'neutral' | 'danger' | 'outline';

const TONE_CLASS: Record<TagTone, string> = {
  accent: 'tag-accent',
  'accent-2': 'tag-accent-2',
  neutral: 'tag-neutral',
  danger: 'tag-danger',
  outline: 'tag-outline',
};

export interface TagProps {
  /** Default `neutral`. */
  tone?: TagTone;
  className?: string;
  children: ReactNode;
}

/** Small label over the Ember `.tag` classes. No module. */
export function Tag({ tone = 'neutral', className, children }: TagProps) {
  const classes = ['tag', TONE_CLASS[tone]];
  if (className) classes.push(className);
  return <span className={classes.join(' ')}>{children}</span>;
}
