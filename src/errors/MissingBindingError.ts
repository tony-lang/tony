import { CompileError } from './CompileError'

export class MissingBindingError extends CompileError {
  private _binding: string
  private _representation: string | undefined
  private _type: string | undefined

  constructor(binding: string, type?: string, representation?: string) {
    super(undefined)
    this.name = this.constructor.name

    this._binding = binding
    this._type = type
    this._representation = representation
  }

  get binding(): string {
    return this._binding
  }

  get representation(): string | undefined {
    return this._representation
  }

  get type(): string | undefined {
    return this._type
  }
}
