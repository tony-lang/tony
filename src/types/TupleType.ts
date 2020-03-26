import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class TupleType extends TypeInterface {
  private _types: TypeConstructor[]

  constructor(types: TypeConstructor[]) {
    super()

    this._types = types
  }

  get types(): TypeConstructor[] {
    return this._types
  }

  isValid = (): boolean => this.types.every(type => type.isValid())

  toString = (): string =>
    `(${this.types.map(type => type.toString()).join(', ')})`
}
