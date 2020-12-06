import { CompileError } from './CompileError'

export class InvalidUseOfTypeAsValueError extends CompileError {
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
