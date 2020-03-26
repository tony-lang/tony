import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class TupleType implements TypeInterface {
  private _types: TypeConstructor[]

  constructor(types: TypeConstructor[]) {
    this._types = types
  }

  get types(): TypeConstructor[] {
    return this._types
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof TupleType)) return false

    return this.types.every((type, i) => {
      return type.matches(pattern.types[i])
    })
  }

  isValid = (): boolean => this.types.every(type => type.isValid())

  toString = (): string =>
    `(${this.types.map(type => type.toString()).join(', ')})`
}
