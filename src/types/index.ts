import { Type } from './Type'
import { TypeConstructor, AtomicType } from './TypeConstructor'

export { BasicType } from './BasicType'
export { ListType } from './ListType'
export { MapType } from './MapType'
export { ObjectType } from './ObjectType'
export { RestListType } from './RestListType'
export { TupleType } from './TupleType'

export { MISSING_TYPE_NAME } from './Type'
export const MISSING_TYPE = new TypeConstructor([new Type(null, true)])

export const VOID_TYPE = new TypeConstructor([new Type('Void')])
export const NUMBER_TYPE = new TypeConstructor([new Type('Number')])
export const STRING_TYPE = new TypeConstructor([new Type('String')])

export const BASIC_TYPES = Object.freeze([
  VOID_TYPE,
  NUMBER_TYPE,
  STRING_TYPE
])

export { AtomicType, Type, TypeConstructor }
