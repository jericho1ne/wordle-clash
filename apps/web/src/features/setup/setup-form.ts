import {
  ANIMAL_COUNT,
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

export type RoomEntryMode = 'create' | 'join'

export function getRandomAnimalId(random: () => number = Math.random): number {
  return Math.floor(random() * ANIMAL_COUNT)
}

export function isSetupSubmissionValid(
  name: string,
  animalId: number | null,
  mode: RoomEntryMode,
  roomCode: string,
): boolean {
  if (!name.trim()) return false
  if (animalId === null) return false
  return mode === 'create' || isValidRoomCode(normalizeRoomCode(roomCode))
}
