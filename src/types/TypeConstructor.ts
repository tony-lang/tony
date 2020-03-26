import { Type } from './Type'
import { BasicType } from './BasicType'
import { ListType } from './ListType'
import { MapType } from './MapType'
import { ModuleType } from './ModuleType'
import { TupleType } from './TupleType'
import { TypeInterface } from './TypeInterface'
import { VOID_TYPE } from '.'

export type AtomicType = Type | BasicType | ListType | MapType | ModuleType |
                         TupleType | TypeConstructor

export class TypeConstructor implements TypeInterface {
  private _types: AtomicType[]
  private _isOptional: boolean

  constructor(types: AtomicType[], isOptional = false) {
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

  concat = (typeConstructor: TypeConstructor): TypeConstructor =>
    new TypeConstructor(this._types.concat(typeConstructor._types))

  apply = (appliedArgs: number[]): TypeConstructor =>
    new TypeConstructor(this._types.filter((_, i) => !appliedArgs.includes(i)))

  pop = (): AtomicType => this._types.pop()

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof TypeConstructor)) return false
    if (this.types.length != pattern.types.length) return false

    return this.types.every((type, i) => {
      return type.matches(pattern.types[i])
    })
  }

  isValid = (): boolean => {
    if (this._types.includes(VOID_TYPE))
      return this._types.length == 2 && !this._types[1].matches(VOID_TYPE)

    return this._types.every(type => type.isValid())
  }

  toString = (): string => this._types.map(type => type.toString()).join(' -> ')
}
