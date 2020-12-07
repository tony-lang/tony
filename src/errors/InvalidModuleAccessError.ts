import { CompileError } from './CompileError'

export class InvalidModuleAccessError extends CompileError {
  private _binding: string | undefined
  private _type: string

  constructor(type: string, binding?: string) {
    super(undefined)
    this.name = this.constructor.name

    this._binding = binding
    this._type = type
  }

  get binding(): string | undefined {
    return this._binding
  }

  get type(): string {
    return this._type
  }
}
