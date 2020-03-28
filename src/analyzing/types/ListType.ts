import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ListType implements TypeInterface {
  private _type: TypeConstructor
  private _isRest: boolean

  constructor(type: TypeConstructor, isRest = false) {
    this._type = type
    this._isRest = isRest
  }

  get type(): TypeConstructor {
    return this._type
  }

  get isRest(): boolean {
    return this._isRest
  }

  set isRest(value: boolean) {
    this._isRest = value
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof ListType)) return false
    if (this.isRest != pattern.isRest) return false

    return this.type.matches(pattern.type)
  }

  isComplete = (): boolean => this.type.isComplete()
  isValid = (): boolean => this.type.isValid()

  toString = (): string =>
    `${this.isRest ? '...' : ''}[${this.type.toString()}]`
}
