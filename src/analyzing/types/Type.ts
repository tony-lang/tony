import { TypeInterface } from './TypeInterface'

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

  resolve = (name: string): void => {
    if (this.isComplete()) return

    this._name = name
    this._isMissing = false
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof Type)) return false
    if (pattern.isMissing) {
      pattern.resolve(this.name)

      return true
    }

    return this.name === pattern.name
  }

  isComplete = (): boolean => !this.isMissing
  isValid = (): boolean => true

  toString = (): string => this.name
}
