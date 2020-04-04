import { CompileError } from './CompileError'

export class ExportOutsideModuleScopeError extends CompileError {
  constructor() {
    super(undefined)
    this.name = this.constructor.name
  }
}
