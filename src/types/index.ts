export {
  ModuleType,
  ParametricType,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
  TypeVariable,
} from './models'
export { BuildType } from './services'

export const FUNCTION_TYPE = Object.freeze('->')
export const VOID_TYPE = Object.freeze('Void')
export const BOOLEAN_TYPE = Object.freeze('Boolean')
export const NUMBER_TYPE = Object.freeze('Number')
export const STRING_TYPE = Object.freeze('String')
export const REGULAR_EXPRESSION_TYPE = Object.freeze('RegularExpression')
export const LIST_TYPE = Object.freeze('List')
export const MAP_TYPE = Object.freeze('Map')
export const TUPLE_TYPE = Object.freeze('Tuple')

export const BASIC_TYPES = Object.freeze([
  FUNCTION_TYPE,
  VOID_TYPE,
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  STRING_TYPE,
  REGULAR_EXPRESSION_TYPE,
  LIST_TYPE,
  MAP_TYPE,
  TUPLE_TYPE,
])
