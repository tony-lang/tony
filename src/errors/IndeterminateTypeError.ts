import { CompileError } from './CompileError'

export class IndeterminateTypeError extends CompileError {
  private _types: string[]

  constructor(types: string[]) {
    super(undefined)
    this.name = this.constructor.name

    this._types = types
  }

  get types(): string[] {
    return this._types
  }
}
