import { ResolvedType } from './categories'
import { TypeVariable } from './types'

// ---- Types ----

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
