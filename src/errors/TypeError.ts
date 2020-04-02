import { CompileError } from './CompileError'
import { Type } from '../analyzing/types'

export type TypeMismatch = [string, string | undefined]

export class TypeError extends CompileError {
  private _typeTrace: TypeMismatch[]

  constructor(expected: Type, actual: Type | undefined, message: string) {
    super(message)
    this.name = this.constructor.name

    this._typeTrace = [
      [expected.toString(), actual ? actual.toString() : undefined],
    ]
  }

  get typeTrace(): TypeMismatch[] {
    return this._typeTrace
  }

  addTypeMismatch = (expected: Type, actual?: Type): void => {
    this._typeTrace = [
      ...this.typeTrace,
      [expected.toString(), actual ? actual.toString() : undefined],
    ]
  }
}
