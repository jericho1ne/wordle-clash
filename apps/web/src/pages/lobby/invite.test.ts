import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  copyRoomCode,
  getInvitePayload,
  getInviteUrl,
  shareRoomInvite,
} from './invite'

describe('room invites', () => {
  it('builds a canonical room URL and share payload', () => {
    expect(getInviteUrl('https://wordleclash.com/', 'plum7421')).toBe(
      'https://wordleclash.com/room/PLUM-7421',
    )
    expect(getInvitePayload('https://wordleclash.com', 'PLUM-7421')).toEqual({
      title: 'Join my Wordle Clash room',
      text: 'Race me to the word in room PLUM-7421.',
      url: 'https://wordleclash.com/room/PLUM-7421',
    })
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn(async () => undefined)
    const writeText = vi.fn(async () => undefined)

    await expect(shareRoomInvite('https://wordleclash.com', 'PLUM-7421', {
      share,
      clipboard: { writeText },
    })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(getInvitePayload(
      'https://wordleclash.com',
      'PLUM-7421',
    ))
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies the invite URL when native sharing is unavailable', async () => {
    const writeText = vi.fn(async () => undefined)

    await expect(shareRoomInvite('https://wordleclash.com', 'PLUM-7421', {
      share: undefined,
      clipboard: { writeText },
    })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(
      'https://wordleclash.com/room/PLUM-7421',
    )
  })

  it('copies only the canonical room code', async () => {
    const writeText = vi.fn(async () => undefined)

    await copyRoomCode('plum7421', { writeText })
    expect(writeText).toHaveBeenCalledWith('PLUM-7421')
  })
})
