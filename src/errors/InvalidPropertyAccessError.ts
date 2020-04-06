import { CompileError } from './CompileError'

export class InvalidPropertyAccessError extends CompileError {
  private _property: string
  private _representation: string
  private _type: string

  constructor(property: string, type: string, representation: string) {
    super(undefined)
    this.name = this.constructor.name

    this._property = property
    this._type = type
    this._representation = representation
  }

  get property(): string {
    return this._property
  }

  get representation(): string {
    return this._representation
  }

  get type(): string {
    return this._type
  }
}
