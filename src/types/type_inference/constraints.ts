import { DeclaredType, ResolvedType, Type } from './categories'
import { TypeVariable } from './types'

// ---- Types ----

/**
 * A constrained type represents a type alongside constraints on type variables.
 */
export type ConstrainedType<T extends DeclaredType | Type> = {
  type: T
  constraints: TypeConstraints
}

/**
 * A set of assignments of type variables to their most general type.
 */
export type TypeConstraints = TypeVariableAssignment[]

/**
 * Maps a set of type variables to their most general type (if any).
 */
export type TypeVariableAssignment = {
  typeVariables: TypeVariable[]
  type?: ResolvedType
}

// ---- Factories ----

export const buildConstrainedType = <T extends DeclaredType | Type>(
  type: T,
  constraints: TypeConstraints = [],
): ConstrainedType<T> => ({
  type,
  constraints,
})

export const buildTypeConstraints = (
  constraints: TypeVariableAssignment[] = [],
): TypeConstraints => constraints

export const buildTypeVariableAssignment = (
  typeVariables: TypeVariable[],
  type?: ResolvedType,
): TypeVariableAssignment => ({
  typeVariables,
  type,
})
