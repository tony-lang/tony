import { CompileError } from './CompileError'

export class InvalidExternalTypeImportError extends CompileError {
  private _type: string

  constructor(type: string) {
    super(undefined)
    this.name = this.constructor.name

    this._type = type
  }

  get type(): string {
    return this._type
  }
}
