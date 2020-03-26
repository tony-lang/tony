import { Type } from './Type'
import { TypeConstructor, AtomicType } from './TypeConstructor'

export { BasicType } from './BasicType'
export { ListType } from './ListType'
export { MapType } from './MapType'
export { ModuleType } from './ModuleType'
export { TupleType } from './TupleType'

export const VOID_TYPE = new Type('Void')
export const NUMBER_TYPE = new Type('Number')
export const STRING_TYPE = new Type('String')

export const VOID_TYPE_CONSTRUCTOR = new TypeConstructor([new Type('Void')])
export const NUMBER_TYPE_CONSTRUCTOR = new TypeConstructor([new Type('Number')])
export const STRING_TYPE_CONSTRUCTOR = new TypeConstructor([new Type('String')])

export const BASIC_TYPES = Object.freeze([
  VOID_TYPE,
  NUMBER_TYPE,
  STRING_TYPE
])

export { AtomicType, Type, TypeConstructor }
