import { CompileError } from './CompileError'
import { InternalTypeError } from './InternalTypeError'

export class TypeError extends CompileError {
  private _trace: InternalTypeError[]

  constructor() {
    super(undefined)
    this.name = this.constructor.name

    this._trace = TypeError.trace
  }

  get trace(): InternalTypeError[] {
    return this._trace
  }

  static _trace: InternalTypeError[] = []

  static get trace(): InternalTypeError[] {
    return TypeError._trace
  }

  static addError(error: InternalTypeError): void {
    TypeError._trace = [...TypeError.trace, error]
  }

  static safe = <T>(fn: () => T): T | undefined => {
    try {
      return fn()
    } catch (error) {
      if (error instanceof InternalTypeError) {
        TypeError.addError(error)

        return
      }

      throw error
    }
  }
}
