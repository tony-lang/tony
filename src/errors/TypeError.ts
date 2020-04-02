import { Type } from '../analyzing/types'

import { CompileError } from './CompileError'

export type TypeMismatch = [string, string]

export class TypeError extends CompileError {
  private _typeTrace: TypeMismatch[]

  constructor(expected: Type, actual: Type, message: string) {
    super(message)
    this.name = this.constructor.name

    this._typeTrace = [[expected.toString(), actual.toString()]]
  }

  get typeTrace(): TypeMismatch[] {
    return this._typeTrace
  }

  addTypeMismatch = (expected: Type, actual: Type): void => {
    this._typeTrace = [
      [expected.toString(), actual.toString()],
      ...this.typeTrace
    ]
  }
}
