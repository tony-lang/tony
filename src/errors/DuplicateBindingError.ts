import { CompileError } from './CompileError'

export class DuplicateBindingError extends CompileError {
  private _name: string

  constructor(name: string) {
    super(null)

    this._name = name
  }

  get name(): string {
    return this._name
  }
}
