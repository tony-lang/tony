import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ListType extends TypeInterface {
  private _type: TypeConstructor

  constructor(type: TypeConstructor) {
    super()

    this._type = type
  }

  get type(): TypeConstructor {
    return this._type
  }

  isValid = (): boolean => this.type.isValid()

  toString = (): string => `[${this.type.toString()}]`
}
