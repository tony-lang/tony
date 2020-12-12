import { ConcreteScope } from '../analyze/scopes'

// ---- Types ----

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
