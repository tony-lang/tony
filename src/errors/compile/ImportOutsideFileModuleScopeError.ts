import { CompileError, Context } from '../CompileError'

export class ImportOutsideFileModuleScopeError extends CompileError {
  constructor(context: Context) {
    super(context)
    this.name = this.constructor.name
  }
}
