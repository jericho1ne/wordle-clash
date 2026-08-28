import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  parseConnectionIdentity,
  userConnectionTag,
} from './connection'

function identityRequest(headers: Record<string, string>): Request {
  return new Request('http://localhost/ws/room/TEST-0001', { headers })
}

describe('room connection identity', () => {
  it('reads the trusted Worker headers', () => {
    expect(parseConnectionIdentity(identityRequest({
      'x-user-id': 'user-1',
      'x-user-name': 'Nova',
      'x-user-avatar': '2',
      'x-user-animal': '7',
      'x-user-is-anonymous': 'true',
    }))).toEqual({
      userId: 'user-1',
      name: 'Nova',
      avatarId: 2,
      animalId: 7,
      isAnonymous: true,
    })
  })

  it('rejects missing or malformed trusted headers', () => {
    expect(() => parseConnectionIdentity(identityRequest({}))).toThrow()
    expect(() => parseConnectionIdentity(identityRequest({
      'x-user-id': 'user-1',
      'x-user-name': 'Nova',
      'x-user-avatar': 'not-a-number',
      'x-user-is-anonymous': 'true',
    }))).toThrow()
    expect(() => parseConnectionIdentity(identityRequest({
      'x-user-id': 'user-1',
      'x-user-name': 'Nova',
      'x-user-avatar': '99',
      'x-user-is-anonymous': 'true',
    }))).toThrow()
  })

  it('produces a stable multi-tab connection tag', () => {
    expect(userConnectionTag('user-1')).toBe('user:user-1')
  })
})
