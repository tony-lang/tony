import { CurriedTypeConstructor } from './CurriedTypeConstructor'
import { ListType } from './ListType'
import { MapType } from './MapType'
import { ObjectType } from './ObjectType'
import { SingleTypeConstructor } from './SingleTypeConstructor'
import { TupleType } from './TupleType'
import { Type } from './Type'

export type AtomicType = Type | ListType | MapType | ObjectType | TupleType

export const MISSING_TYPE = Object.freeze('MISSING_TYPE')
export const PLACEHOLDER_TYPE = Object.freeze('?')

export const VOID_TYPE = 'Void'
export const BOOLEAN_TYPE = 'Boolean'
export const NUMBER_TYPE = 'Number'
export const STRING_TYPE = 'String'
export const REGULAR_EXPRESSION_TYPE = 'RegularExpression'

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
