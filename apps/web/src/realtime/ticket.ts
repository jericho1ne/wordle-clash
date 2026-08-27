import { ensureIdentity } from '../identity'

interface RealtimeTicketResponse {
  ticket: string
  expiresIn: number
}

/** Fetch a fresh query object for every initial socket connection or reconnect. */
export async function getRealtimeTicketQuery(): Promise<Record<string, string>> {
  await ensureIdentity()

  const response = await fetch('/api/rt/ticket', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Unable to authorize realtime connection (${response.status})`)
  }

  const result = (await response.json()) as RealtimeTicketResponse

  if (!result.ticket || result.expiresIn <= 0) {
    throw new Error('Realtime ticket response is malformed')
  }

  return { ticket: result.ticket }
}
