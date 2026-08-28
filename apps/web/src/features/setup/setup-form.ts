import {
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

export type RoomEntryMode = 'create' | 'join'

export function isSetupSubmissionValid(
  name: string,
  mode: RoomEntryMode,
  roomCode: string,
): boolean {
  if (!name.trim()) return false
  return mode === 'create' || isValidRoomCode(normalizeRoomCode(roomCode))
}
