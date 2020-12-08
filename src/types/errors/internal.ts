export function assert(value: boolean, message: string): asserts value {
  if (value) return

  throw new InternalError(message)
}

class InternalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
