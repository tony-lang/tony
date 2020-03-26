import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ListType implements TypeInterface {
  private _type: TypeConstructor

  constructor(type: TypeConstructor) {
    this._type = type
  }

  get type(): TypeConstructor {
    return this._type
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof ListType)) return false

    return this.type.matches(pattern.type)
  }

  isValid = (): boolean => this.type.isValid()

  toString = (): string => `[${this.type.toString()}]`
}
