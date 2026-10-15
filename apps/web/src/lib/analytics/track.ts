import { event } from '@lowtyde/analytics'

// App-specific event names live here so the GTM wrapper stays reusable.
export type GameEvent = 'room_created' | 'room_joined' | 'match_started'

export function trackGameEvent(name: GameEvent, params: Record<string, unknown> = {}) {
  event(name, params)
}
