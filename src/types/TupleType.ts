import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class TupleType extends TypeInterface {
  private _types: TypeConstructor[]

  constructor(types: TypeConstructor[]) {
    super()

    this._types = types
  }

  isValid = (): boolean => this._types.every(type => type.isValid())

  toString = (): string => `(${this._types.map(type => type.toString()).join(', ')})`
}
