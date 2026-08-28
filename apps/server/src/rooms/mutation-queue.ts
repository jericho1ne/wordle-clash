export class MutationQueue {
  #tail: Promise<void> = Promise.resolve()

  run<Result>(operation: () => Promise<Result>): Promise<Result> {
    const result = this.#tail.then(operation, operation)
    this.#tail = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }
}
