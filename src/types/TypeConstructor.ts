import { Type } from './Type'
import { ListType } from './ListType'
import { MapType } from './MapType'
import { ModuleType } from './ModuleType'
import { TupleType } from './TupleType'
import { TypeInterface } from './TypeInterface'
import { VOID_TYPE } from '.'

export type AtomicType = Type | ListType | MapType | ModuleType | TupleType | TypeConstructor

export class TypeConstructor extends TypeInterface {
  private _types: AtomicType[]

  constructor(types: AtomicType[]) {
    super()

    this._types = types
  }

  get types(): AtomicType[] {
    return this._types
  }

  get length(): number {
    return this._types.length
  }

  concat = (typeConstructor: TypeConstructor): TypeConstructor =>
    new TypeConstructor(this._types.concat(typeConstructor._types))

  apply = (argsCount: number): TypeConstructor =>
    new TypeConstructor(this._types.slice(argsCount))

  pop = (): AtomicType => this._types.pop()

  isValid = (): boolean => {
    if (this._types.includes(VOID_TYPE))
      return this._types.length == 2 && !this._types[1].equals(VOID_TYPE)

    return this._types.every(type => type.isValid())
  }

  toString = (): string => this._types.map(type => type.toString()).join(' -> ')
}
