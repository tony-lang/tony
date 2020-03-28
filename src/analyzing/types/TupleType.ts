import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class TupleType implements TypeInterface {
  private _types: TypeConstructor[]
  private _isRest: boolean

  constructor(types: TypeConstructor[], isRest = false) {
    this._types = types
    this._isRest = isRest
  }

  get types(): TypeConstructor[] {
    return this._types
  }

  get isRest(): boolean {
    return this._isRest
  }

  set isRest(value: boolean) {
    this._isRest = value
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof TupleType)) return false
    if (this.types.length != pattern.types.length) return false

    return this.isRest == pattern.isRest && this.types.every((type, i) => {
      return type.matches(pattern.types[i])
    })
  }

  isValid = (): boolean => this.types.every(type => type.isValid())

  toString = (): string =>
    `${this.isRest ? '...' : ''}` +
    `(${this.types.map(type => type.toString()).join(', ')})`
}
