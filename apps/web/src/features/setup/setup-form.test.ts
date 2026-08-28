import {
  describe,
  expect,
  it,
} from 'vitest'

import { isSetupSubmissionValid } from './setup-form'

describe('isSetupSubmissionValid', () => {
  it('requires a non-empty trimmed name', () => {
    expect(isSetupSubmissionValid('', 'create', '')).toBe(false)
    expect(isSetupSubmissionValid('   ', 'create', '')).toBe(false)
    expect(isSetupSubmissionValid('Nova', 'create', '')).toBe(true)
  })

  it('requires a complete canonical room code when joining', () => {
    expect(isSetupSubmissionValid('Nova', 'join', 'PLUM')).toBe(false)
    expect(isSetupSubmissionValid('Nova', 'join', 'plum7421')).toBe(true)
    expect(isSetupSubmissionValid('Nova', 'join', 'IOOO-0000')).toBe(false)
  })
})
