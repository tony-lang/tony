import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class MapType extends TypeInterface {
  private _keyType: TypeConstructor
  private _valueType: TypeConstructor

  constructor(keyType: TypeConstructor, valueType: TypeConstructor) {
    super()

    this._keyType = keyType
    this._valueType = valueType
  }

  get keyType(): TypeConstructor {
    return this._keyType
  }

  get valueType(): TypeConstructor {
    return this._valueType
  }

  isValid = (): boolean => this._keyType.isValid() && this._valueType.isValid()

  toString = (): string =>
    `{ ${this._keyType.toString()}: ${this._valueType.toString()} }`
}
