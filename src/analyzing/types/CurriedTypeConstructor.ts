import { VOID_TYPE, Type } from '.'
import { ListType } from './ListType'
import { SingleTypeConstructor } from './SingleTypeConstructor'
import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class CurriedTypeConstructor extends TypeConstructor {
  private _types: TypeConstructor[]

  constructor(types: TypeConstructor[], isOptional = false) {
    super(isOptional)

    this._types = types
  }

  get types(): TypeConstructor[] {
    return this._types
  }

  get length(): number {
    return this._types.length
  }

  apply = (appliedArgs: number[]): TypeConstructor => {
    const remainingTypes = new CurriedTypeConstructor(
      this._types.filter((type, i) => {
        if (type instanceof SingleTypeConstructor &&
            type.type instanceof ListType && type.type.isRest) return false

        return !appliedArgs.includes(i)
      })
    )

    if (remainingTypes.length == 1) return remainingTypes.types[0]
    else return remainingTypes
  }

  concat = (
    typeConstructor: TypeConstructor,
    merge = true
  ): CurriedTypeConstructor => {
    if (typeConstructor instanceof SingleTypeConstructor || !merge)
      return new CurriedTypeConstructor(this.types.concat(typeConstructor))
    else if (typeConstructor instanceof CurriedTypeConstructor)
      return new CurriedTypeConstructor(
        this.types.concat(typeConstructor.types)
      )
  }

  matches = (pattern: TypeInterface): boolean => {
    if (pattern instanceof SingleTypeConstructor &&
        pattern.type instanceof Type && pattern.type.isMissing) return true
    if (!(pattern instanceof CurriedTypeConstructor)) return false
    if (this.length != pattern.length) return false

    return this.types.every((type, i) => type.matches(pattern.types[i]))
  }

  isValid = (): boolean => {
    if (this.length < 2) return false

    const voidTypes = this.types.filter(type => type.matches(VOID_TYPE))
    if (voidTypes.length > 1) return this.length == 2 && voidTypes.length == 2
    if (voidTypes.length == 1)
      return this.types.indexOf(voidTypes[0]) == this.length - 1 ||
             this.length == 2 && this.types.indexOf(voidTypes[0]) == 0

    const restListTypes = this.types.filter(type => {
      return (type instanceof SingleTypeConstructor &&
              type.type instanceof ListType && type.type.isRest)
    })
    if (restListTypes.length > 0)
      return restListTypes.length == 1 &&
             this.types.indexOf(restListTypes[0]) == this.length - 2

    return this.types.every(type => type.isValid())
  }

  toString = (): string =>
    `(${this._types.map(type => type.toString()).join(' -> ')})` +
    `${this.isOptional ? '?' : ''}`
}
