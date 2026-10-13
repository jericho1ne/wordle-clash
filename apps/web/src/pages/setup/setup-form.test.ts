import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getRandomAnimalId,
  getRandomGuestName,
  isSetupSubmissionValid,
} from './setup-form'

describe('getRandomAnimalId', () => {
  it('maps random values onto the available animal indexes', () => {
    expect(getRandomAnimalId(() => 0)).toBe(0)
    expect(getRandomAnimalId(() => 0.999)).toBe(19)
  })
})

describe('getRandomGuestName', () => {
  it('creates a short two-word name', () => {
    expect(getRandomGuestName(() => 0)).toBe('Agile-Bat')
    expect(getRandomGuestName(() => 0.999)).toBe('Zesty-Whale')
  })
})

describe('isSetupSubmissionValid', () => {
  it('requires a non-empty trimmed name', () => {
    expect(isSetupSubmissionValid('', 0, 'create', '')).toBe(false)
    expect(isSetupSubmissionValid('   ', 0, 'create', '')).toBe(false)
    expect(isSetupSubmissionValid('Nova', null, 'create', '')).toBe(false)
    expect(isSetupSubmissionValid('Nova', 0, 'create', '')).toBe(true)
  })

  it('requires a complete canonical room code when joining', () => {
    expect(isSetupSubmissionValid('Nova', 0, 'join', 'PLUM')).toBe(false)
    expect(isSetupSubmissionValid('Nova', 0, 'join', 'plum7421')).toBe(true)
    expect(isSetupSubmissionValid('Nova', 0, 'join', 'IOOO-0000')).toBe(false)
  })
})
