import { Binding } from '../../symbol_table'
import { Type } from '../../types/types'
import { CompileError, Context } from '../CompileError'

export class InvalidModuleAccessError extends CompileError {
  private _binding: Binding
  private _type: Type

  constructor(context: Context, type: Type, binding: Binding) {
    super(context)
    this.name = this.constructor.name

    this._binding = binding
    this._type = type
  }

  get binding(): Binding {
    return this._binding
  }

  get type(): Type {
    return this._type
  }
}
