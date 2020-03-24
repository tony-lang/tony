export type TypeConstructor = AtomicType[]
export type AtomicType = Type | GenericType | TypeConstructor
export type Type = string
export type GenericType = { base: Type; args: TypeConstructor[] }

export const NUMBER_TYPE = Object.freeze('Number')
export const STRING_TYPE = Object.freeze('String')

export const LIST_TYPE = Object.freeze('List')
export const TUPLE_TYPE = Object.freeze('Tuple')
export const MAP_TYPE = Object.freeze('Map')

export const BASIC_TYPES = Object.freeze([
  NUMBER_TYPE,
  STRING_TYPE,
  LIST_TYPE,
  TUPLE_TYPE,
  MAP_TYPE
])

export const constructGenericType = (
  base: Type,
  args: TypeConstructor[]
): GenericType => ({ base, args })
