import { CompileError } from './CompileError'

export class MissingBindingError extends CompileError {
  private _binding: string

  constructor(binding: string) {
    super(undefined)
    this.name = this.constructor.name

    this._binding = binding
  }

  get binding(): string {
    return this._binding
  }
}
