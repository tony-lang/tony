import { Type } from '../../types/types'
import { CompileError, Context } from '../CompileError'

export class IndeterminateTypeError extends CompileError {
  private _types: Type[]

  constructor(context: Context, types: Type[]) {
    super(context)
    this.name = this.constructor.name

    this._types = types
  }

  get types(): Type[] {
    return this._types
  }
}
