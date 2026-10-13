import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

export const INVITE_TITLE = 'Join my Wordle Clash room'

interface InviteNavigator {
  clipboard: Pick<Clipboard, 'writeText'>
  share?: (data?: ShareData) => Promise<void>
}

export function getInviteUrl(origin: string, roomCode: string): string {
  const code = normalizeRoomCode(roomCode)
  if (!isValidRoomCode(code)) throw new Error('A valid room code is required')

  return `${origin.replace(/\/$/, '')}/room/${code}`
}

export function getInvitePayload(origin: string, roomCode: string): ShareData {
  const code = normalizeRoomCode(roomCode)

  return {
    title: INVITE_TITLE,
    text: `Race me to the word in room ${code}.`,
    url: getInviteUrl(origin, code),
  }
}

export async function shareRoomInvite(
  origin: string,
  roomCode: string,
  navigatorApi: InviteNavigator = navigator,
): Promise<'shared' | 'copied'> {
  const payload = getInvitePayload(origin, roomCode)

  if (typeof navigatorApi.share === 'function') {
    await navigatorApi.share(payload)
    return 'shared'
  }

  await navigatorApi.clipboard.writeText(payload.url ?? '')
  return 'copied'
}

export async function copyRoomCode(
  roomCode: string,
  clipboard: Pick<Clipboard, 'writeText'> = navigator.clipboard,
): Promise<void> {
  const code = normalizeRoomCode(roomCode)
  if (!isValidRoomCode(code)) throw new Error('A valid room code is required')

  await clipboard.writeText(code)
}
