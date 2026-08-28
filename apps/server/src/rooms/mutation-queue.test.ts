import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { MutationQueue } from './mutation-queue'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('MutationQueue', () => {
  it('does not start the next mutation while storage work is pending', async () => {
    const queue = new MutationQueue()
    const gate = deferred()
    const order: string[] = []

    const first = queue.run(async () => {
      order.push('first:start')
      await gate.promise
      order.push('first:end')
    })
    const secondOperation = vi.fn(async () => {
      order.push('second')
    })
    const second = queue.run(secondOperation)

    await Promise.resolve()
    expect(secondOperation).not.toHaveBeenCalled()

    gate.resolve()
    await Promise.all([first, second])
    expect(order).toEqual(['first:start', 'first:end', 'second'])
  })

  it('continues after a rejected mutation', async () => {
    const queue = new MutationQueue()
    const failed = queue.run(async () => {
      throw new Error('failed')
    })
    const next = queue.run(async () => 'recovered')

    await expect(failed).rejects.toThrow('failed')
    await expect(next).resolves.toBe('recovered')
  })
})
