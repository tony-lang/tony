import { ObjectScope } from '../analyze/scopes'

// ---- Types ----

enum TypeKind {
  Alias,
  Object,
  Parametric,
  Variable,
}

/**
 * A type variable represents any type.
 */
export interface TypeVariable {
  kind: typeof TypeKind.Variable
}

/**
 * A type alias represents an existing type under a new name.
 */
export interface TypeAlias {
  kind: typeof TypeKind.Alias
  name: string
  type: Type
}

/**
 * A parametric type represents a concrete type that may depend on other types.
 */
export interface ParametricType {
  kind: typeof TypeKind.Parametric
  name: string
  parameters: Type[]
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType extends ObjectScope {
  kind: typeof TypeKind.Object
}

export type Type = TypeVariable | TypeAlias | ParametricType | ObjectType

/**
 * A constrained type represents a type alongside constraints on type variables.
 */
export type ConstrainedType<T extends Type> = {
  type: T
  constraints: TypeConstraints
}

/**
 * A set of assignments of type variables to their most general type.
 */
export type TypeConstraints = TypeVariableAssignment<Type>[]

/**
 * Maps a type variable to its most general type.
 */
type TypeVariableAssignment<T extends Type> = {
  typeVariable: TypeVariable
  type: T
}

// ---- Factories ----

export const buildTypeVariable = (): TypeVariable => ({
  kind: TypeKind.Variable,
})

export const buildConstrainedType = <T extends Type>(
  type: T,
  constraints: TypeConstraints = [],
): ConstrainedType<T> => ({
  type,
  constraints,
})
