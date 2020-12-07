import { Binding } from '../../symbol_table'
import { CompileError, Context } from '../CompileError'

export class MissingExternalImportTypeHintError extends CompileError {
  private _binding: Binding

  constructor(context: Context, binding: Binding) {
    super(context)
    this.name = this.constructor.name

    this._binding = binding
  }

  get binding(): Binding {
    return this._binding
  }
}
