/* eslint-disable react-refresh/only-export-components --
   compound component: Card + Card.Kicker/.Title/.Body/.Meta live in one file. */
import type { ReactNode } from 'react';

export interface CardProps {
  /** Adds `.elev-sm|md|lg`. */
  elevation?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

function CardRoot({ elevation, className, children }: CardProps) {
  const classes = ['card'];
  if (elevation) classes.push(`elev-${elevation}`);
  if (className) classes.push(className);
  return <div className={classes.join(' ')}>{children}</div>;
}

function Kicker({ children }: { children: ReactNode }) {
  return <div className="card-kicker">{children}</div>;
}
function Title({ children }: { children: ReactNode }) {
  return <div className="card-title">{children}</div>;
}
function Body({ children }: { children: ReactNode }) {
  return <p className="card-body">{children}</p>;
}
function Meta({ children }: { children: ReactNode }) {
  return <div className="card-meta">{children}</div>;
}

/**
 * Surface card over the Ember `.card` classes. Compound:
 * `<Card><Card.Kicker/><Card.Title/><Card.Body/><Card.Meta/></Card>`. No module.
 */
export const Card = Object.assign(CardRoot, { Kicker, Title, Body, Meta });
