abstract class RuntimeError extends Error {
  constructor(message: string) {
    super(
      `${message}

      This is a runtime error that should not occur, but instead caught at compile time.
      Please report this bug at https://github.com/tony-lang/tony/issues/new/choose.`,
    )
    this.name = this.constructor.name
  }
}

export class PatternDoesNotMatch extends RuntimeError {
  constructor() {
    super('Pattern does not match.')
    this.name = this.constructor.name
  }
}

export class PatternDoesOnlyPartiallyMatch extends RuntimeError {
  constructor() {
    super('Pattern does only partially match.')
    this.name = this.constructor.name
  }
}

export class NonExhaustivePatterns extends RuntimeError {
  constructor() {
    super('Non-exhaustive patterns.')
    this.name = this.constructor.name
  }
}
