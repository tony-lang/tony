import { Type } from '../analyzing/types'

import { CompileError } from './CompileError'

type TypeMismatch = [Type, Type]

export class UnificationError extends CompileError {
  private _typeTrace: TypeMismatch[]

  constructor(expected: Type, actual: Type, message: string) {
    super(message)

    this._typeTrace = [[expected, actual]]
  }

  get typeTrace(): TypeMismatch[] {
    return this._typeTrace
  }

  addTypeMismatch = (expected: Type, actual: Type): void => {
    this._typeTrace = [[expected, actual], ...this.typeTrace]
  }
}
