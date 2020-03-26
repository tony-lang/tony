import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'
import { ModuleType } from './ModuleType'

export class MapType implements TypeInterface {
  private _keyType: TypeConstructor
  private _valueType: TypeConstructor

  constructor(keyType: TypeConstructor, valueType: TypeConstructor) {
    this._keyType = keyType
    this._valueType = valueType
  }

  get keyType(): TypeConstructor {
    return this._keyType
  }

  get valueType(): TypeConstructor {
    return this._valueType
  }

  matches = (pattern: TypeInterface): boolean => {
    if (pattern instanceof MapType)
      return this.keyType.matches(pattern.keyType) &&
             this.valueType.matches(pattern.valueType)
    else if (pattern instanceof ModuleType)
      return Array.from(pattern.propertyTypes.values())
        .every(propertyType => this.valueType.matches(propertyType))
    else return false
  }

  isValid = (): boolean => this._keyType.isValid() && this._valueType.isValid()

  toString = (): string =>
    `{ ${this._keyType.toString()}: ${this._valueType.toString()} }`
}
