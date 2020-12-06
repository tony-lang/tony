import { InternalError } from './InternalError'
import { Type } from '../types'

export type TypeMismatch = [string, string | undefined]

export class InternalTypeError extends InternalError {
  private _trace: TypeMismatch[]

  constructor(expected: Type, actual: Type | undefined, message: string) {
    super(message)
    this.name = this.constructor.name

    this._trace = [
      [expected.toString(), actual ? actual.toString() : undefined],
    ]
  }

  get trace(): TypeMismatch[] {
    return this._trace
  }

  addTypeMismatch = (expected: Type, actual?: Type): void => {
    this._trace = [
      ...this.trace,
      [expected.toString(), actual ? actual.toString() : undefined],
    ]
  }
}
