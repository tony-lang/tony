import { ConcreteScope } from '../analyze/scopes'

export const FUNCTION_TYPE = '->'
export const VOID_TYPE = 'Void'
export const BOOLEAN_TYPE = 'Boolean'
export const NUMBER_TYPE = 'Number'
export const STRING_TYPE = 'String'
export const REGULAR_EXPRESSION_TYPE = 'RegularExpression'
export const LIST_TYPE = 'List'
export const TUPLE_TYPE = 'Tuple'

export type BasicType =
  | typeof FUNCTION_TYPE
  | typeof VOID_TYPE
  | typeof BOOLEAN_TYPE
  | typeof NUMBER_TYPE
  | typeof STRING_TYPE
  | typeof REGULAR_EXPRESSION_TYPE
  | typeof LIST_TYPE
  | typeof TUPLE_TYPE

enum TypeKind {
  Alias,
  Parametric,
  Struct,
  Variable,
}

// a type variable represents any type
export interface TypeVariable {
  kind: typeof TypeKind.Variable
}

// an object type represents the scope of an object
export interface TypeAlias {
  kind: typeof TypeKind.Alias
  name: string
  type: Type
}

// a parametric type represents any concrete type that may depend on other types
export interface ParametricType {
  kind: typeof TypeKind.Parametric
  name: string
  parameters: Type[]
}

// an object type represents the scope of an object
export interface StructType extends ConcreteScope {
  kind: typeof TypeKind.Struct
}

export type Type = TypeVariable | TypeAlias | ParametricType | StructType

// a constrained type represents a type alongside equivalence classes over all types
export type ConstrainedType<T extends Type> = {
  type: T
  equivalenceClasses: TypeEquivalenceClass<T>[]
}

type TypeEquivalenceClass<T extends Type> = T[]
