import { Type } from '../../types/types'
import { CompileError, Context } from '../CompileError'

export type TypeMismatch = {
  expected: Type
  actual: Type
  context: Context
}

export class TypeError extends CompileError {
  private _trace: TypeMismatch[]

  constructor(context: Context, expected: Type, actual: Type, message: string) {
    super(context, message)
    this.name = this.constructor.name

    this._trace = [{ expected, actual, context }]
  }

  get trace(): TypeMismatch[] {
    return this._trace
  }

  addTypeMismatch = (context: Context, expected: Type, actual: Type): void => {
    this._trace = [...this.trace, { expected, actual, context }]
  }
}
