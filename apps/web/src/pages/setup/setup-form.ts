import {
  ANIMAL_COUNT,
  isValidRoomCode,
  normalizeRoomCode,
} from '@wordle-clash/shared'

export type RoomEntryMode = 'create' | 'join'

const GUEST_NAME_PREFIXES = [
  'Agile',
  'Amber',
  'Apex',
  'Astro',
  'Blaze',
  'Bold',
  'Brisk',
  'Cedar',
  'Cipher',
  'Cobalt',
  'Comet',
  'Cosmic',
  'Daring',
  'Delta',
  'Drift',
  'Ember',
  'Fable',
  'Flash',
  'Frost',
  'Glint',
  'Hype',
  'Ivory',
  'Jolly',
  'Laser',
  'Lucky',
  'Lunar',
  'Misty',
  'Neon',
  'Nova',
  'Orbit',
  'Pixel',
  'Quick',
  'Rapid',
  'Rogue',
  'Solar',
  'Sonic',
  'Steel',
  'Swift',
  'Turbo',
  'Vivid',
  'Zesty',
] as const

const GUEST_NAME_ANIMALS = [
  'Bat',
  'Beetle',
  'Bison',
  'Cobra',
  'Crab',
  'Crow',
  'Dingo',
  'Dog',
  'Duck',
  'Finch',
  'Fly',
  'Gator',
  'Gecko',
  'Hippo',
  'Koala',
  'Llama',
  'Lynx',
  'Mantis',
  'Moth',
  'Otter',
  'Panda',
  'Puma',
  'Rabbit',
  'Raven',
  'Shark',
  'Sheep',
  'Squid',
  'Tiger',
  'Viper',
  'Whale',
] as const

export function getRandomAnimalId(random: () => number = Math.random): number {
  return Math.floor(random() * ANIMAL_COUNT)
}

/** A short, guest-friendly display name; account usernames remain user-chosen. */
export function getRandomGuestName(random: () => number = Math.random): string {
  const prefix = GUEST_NAME_PREFIXES[Math.floor(random() * GUEST_NAME_PREFIXES.length)]!
  const animal = GUEST_NAME_ANIMALS[Math.floor(random() * GUEST_NAME_ANIMALS.length)]!

  return `${prefix}-${animal}`
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
