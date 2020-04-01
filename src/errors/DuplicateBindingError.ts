import { CompileError } from './CompileError'

export class DuplicateBindingError extends CompileError {
  private _binding: string

  constructor(binding: string) {
    super(null)
    this.name = this.constructor.name

    this._binding = binding
  }

  get binding(): string {
    return this._binding
  }
}
