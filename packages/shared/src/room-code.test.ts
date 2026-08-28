import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  ROOM_CODE_LENGTH,
} from './room-code.js'

describe('generateRoomCode', () => {
  it('generates the canonical code shape', () => {
    const code = generateRoomCode(() => 0)
    expect(code).toBe('AAAA-0000')
    expect(code).toHaveLength(ROOM_CODE_LENGTH)
    expect(isValidRoomCode(code)).toBe(true)
  })

  it('uses the full unambiguous alphabet and digit range', () => {
    expect(generateRoomCode(() => 0.999_999)).toBe('ZZZZ-9999')

    let seed = 17
    const code = generateRoomCode(() => {
      seed = (seed * 48_271) % 2_147_483_647
      return seed / 2_147_483_647
    })

    expect(code).not.toMatch(/[IO]/)
    expect(isValidRoomCode(code)).toBe(true)
  })
})

describe('normalizeRoomCode', () => {
  it('uppercases, strips punctuation, and inserts the dash', () => {
    expect(normalizeRoomCode(' plum 7421 ')).toBe('PLUM-7421')
    expect(normalizeRoomCode('plum-7421')).toBe('PLUM-7421')
  })

  it('preserves partial input and caps canonical length', () => {
    expect(normalizeRoomCode('plu')).toBe('PLU')
    expect(normalizeRoomCode('plum742199')).toBe('PLUM-7421')
  })
})

describe('isValidRoomCode', () => {
  it('rejects ambiguous letters and malformed shapes', () => {
    expect(isValidRoomCode('IOOO-0000')).toBe(false)
    expect(isValidRoomCode('PLUM7421')).toBe(false)
    expect(isValidRoomCode('plum-7421')).toBe(false)
    expect(isValidRoomCode('PLUM-742')).toBe(false)
  })
})
