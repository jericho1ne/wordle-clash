/**
 * Room codes are `LLLL-DDDD` — four letters, a dash, four digits.
 * The letter alphabet omits I and O to avoid confusion with 1 and 0.
 */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '0123456789';

export const ROOM_CODE_LENGTH = 9; // "ABCD-1234"
export const ROOM_CODE_REGEX = /^[A-HJ-NP-Z]{4}-[0-9]{4}$/;

/** RNG shape compatible with `Math.random`; injectable for deterministic tests. */
export type Rng = () => number;

export function generateRoomCode(rng: Rng = Math.random): string {
  let letters = '';
  for (let i = 0; i < 4; i++) {
    letters += LETTERS.charAt(Math.floor(rng() * LETTERS.length));
  }
  let digits = '';
  for (let i = 0; i < 4; i++) {
    digits += DIGITS.charAt(Math.floor(rng() * DIGITS.length));
  }
  return `${letters}-${digits}`;
}

/**
 * Normalize free-form user input toward the canonical form: uppercase, strip
 * everything that isn't A–Z/0–9, then re-insert the dash after the 4th char.
 * Partial input (while typing) is returned as-is up to 4 chars.
 */
export function normalizeRoomCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
}

export function isValidRoomCode(input: string): boolean {
  return ROOM_CODE_REGEX.test(input);
}
