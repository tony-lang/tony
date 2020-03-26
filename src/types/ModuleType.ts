import { Type } from './Type'
import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ModuleType extends TypeInterface {
  private _type: Map<string, TypeConstructor>

  constructor(type: Map<string, TypeConstructor>) {
    super()

    this._type = type
  }

  isValid = (): boolean => Array.from(this._type.values()).every(type => type.isValid())

  toString = (): string => `{ ${Array.from(this._type.entries()).map(([binding, type]) => `${binding}: ${type.toString()}`).join(', ')} }`
}
