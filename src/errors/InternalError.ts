export class InternalError extends Error {
  private _context: string | undefined

  constructor(message: string, context?: string) {
    super(message)
    this.name = this.constructor.name

    this._context = context
  }

  get context(): string | undefined {
    return this._context
  }
}

export function assert(value: boolean, message: string): asserts value {
  if (value) return

  throw new InternalError(message)
}
