import { TypeInterface } from './TypeInterface'

export const MISSING_TYPE_NAME = Object.freeze('MISSING_TYPE')

export class Type implements TypeInterface {
  private _name: string
  private _isMissing: boolean

  constructor(name: string, isMissing = false) {
    this._name = name
    this._isMissing = isMissing
  }

  get name(): string {
    return this._name
  }

  get isMissing(): boolean {
    return this._isMissing
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof Type)) return false

    return pattern.isMissing || this.name === pattern.name
  }

  isComplete = (): boolean => !this.isMissing
  isValid = (): boolean => true

  toString = (): string => this.isMissing ? MISSING_TYPE_NAME : this.name
}
