import { CurriedTypeConstructor } from './CurriedTypeConstructor'
import { ListType } from './ListType'
import { MapType } from './MapType'
import { ObjectType } from './ObjectType'
import { SingleTypeConstructor } from './SingleTypeConstructor'
import { TupleType } from './TupleType'
import { Type } from './Type'

export type AtomicType = Type | ListType | MapType | ObjectType | TupleType

export { MISSING_TYPE_NAME } from './Type'
export const MISSING_TYPE = new SingleTypeConstructor(new Type(null, true))

export const VOID_TYPE = new SingleTypeConstructor(new Type('Void'))
export const BOOLEAN_TYPE = new SingleTypeConstructor(new Type('Boolean'))
export const NUMBER_TYPE = new SingleTypeConstructor(new Type('Number'))
export const STRING_TYPE = new SingleTypeConstructor(new Type('String'))
export const REGULAR_EXPRESSION_TYPE =
  new SingleTypeConstructor(new Type('RegularExpression'))

export const BASIC_TYPES = Object.freeze([
  VOID_TYPE,
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  STRING_TYPE,
  REGULAR_EXPRESSION_TYPE
])

export { TypeConstructor } from './TypeConstructor'
export {
  CurriedTypeConstructor,
  ListType,
  MapType,
  ObjectType,
  SingleTypeConstructor,
  TupleType,
  Type
}
