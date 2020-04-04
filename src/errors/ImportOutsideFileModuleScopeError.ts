import { CompileError } from './CompileError'

export class ImportOutsideFileModuleScopeError extends CompileError {
  constructor() {
    super(undefined)
    this.name = this.constructor.name
  }
}
