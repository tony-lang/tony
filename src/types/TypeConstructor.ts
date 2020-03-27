import { Type } from './Type'
import { BasicType } from './BasicType'
import { ListType } from './ListType'
import { MapType } from './MapType'
import { ObjectType } from './ObjectType'
import { RestListType } from './RestListType'
import { TupleType } from './TupleType'
import { TypeInterface } from './TypeInterface'
import { VOID_TYPE, MISSING_TYPE } from '.'

export type AtomicType = Type | BasicType | ListType | MapType | ObjectType |
                         RestListType | TupleType | TypeConstructor

export class TypeConstructor implements TypeInterface {
  private _types: AtomicType[]
  private _isOptional: boolean

  constructor(types: AtomicType[], isOptional = false) {
    // if (types.length == 1 && types[0] instanceof TypeConstructor)
    //   this._types = types[0].types
    // else
    this._types = types

    this._isOptional = isOptional
  }

  get types(): AtomicType[] {
    return this._types
  }

  get isOptional(): boolean {
    return this._isOptional
  }

  set isOptional(value: boolean) {
    this._isOptional = value
  }

  get length(): number {
    return this._types.length
  }

  concat = (typeConstructor: TypeConstructor): TypeConstructor => {
    if (typeConstructor.length == 1)
      return new TypeConstructor(this._types.concat(typeConstructor))
    else
      return new TypeConstructor(this._types.concat(typeConstructor._types))
  }

  apply = (appliedArgs: number[]): TypeConstructor =>
    new TypeConstructor(this._types.filter((type, i) => {
      if (type instanceof RestListType) return true

      return !appliedArgs.includes(i)
    }))

  pop = (): AtomicType => this._types.pop()

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof TypeConstructor)) return false
    if (this.types.length != pattern.types.length) return false

    return this.types.every((type, i) => {
      return type.matches(pattern.types[i])
    })
  }

  isValid = (): boolean => {
    const voidTypes = this._types.filter(type => type.matches(VOID_TYPE))
    if (voidTypes.length > 0)
      return this._types.length == 2 && voidTypes.length == 1 &&
             this._types.indexOf(voidTypes[0]) == 0

    const restListTypes =
      this._types.filter(type => type.matches(REST_LIST_TYPE))
    if (restListTypes.length > 0)
      return this._types.length > 1 && restListTypes.length == 1 &&
             this._types.indexOf(restListTypes[0]) == this._types.length - 2

    return this._types.every(type => type.isValid())
  }

  toString = (): string => {
    const str = this._types.map(type => type.toString()).join(' -> ')

    if (this.length > 1 || this.types[0] instanceof TypeConstructor)
      return `(${str})`
    else return str
  }
}

const REST_LIST_TYPE =
  new TypeConstructor([new RestListType(new ListType(MISSING_TYPE))])
