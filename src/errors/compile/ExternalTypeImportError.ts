import { Type } from '../../types/util'
import { CompileError, Context } from '../CompileError'

export class ExternalTypeImportError extends CompileError {
  private _type: Type

  constructor(context: Context, type: Type) {
    super(context)
    this.name = this.constructor.name

    this._type = type
  }

  get type(): Type {
    return this._type
  }
}
