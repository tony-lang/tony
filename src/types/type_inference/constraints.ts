import { ResolvedType } from './categories'
import { TermBinding } from '../analyze/bindings'
import { TypeVariable } from './types'

// ---- Types ----

/**
 * A set of assignments of type variables to their most general type.
 */
export type Constraints = {
  assignments: TypeVariableAssignment[]
  deferredAssignments: DeferredTypeVariableAssignment[]
}

/**
 * Maps a set of type variables to their most general type (if any).
 */
export type TypeVariableAssignment = {
  typeVariables: TypeVariable[]
  type?: ResolvedType
}

/**
 * Maps a type variable to a set of bindings stating that the type variable must
 * take one of their types. The check is deferred until the type of all bindings
 * was determined.
 */
export type DeferredTypeVariableAssignment = {
  typeVariable: TypeVariable
  bindings: TermBinding[]
}

// ---- Factories ----

export const buildConstraints = (
  assignments: TypeVariableAssignment[] = [],
  deferredAssignments: DeferredTypeVariableAssignment[] = [],
): Constraints => ({ assignments, deferredAssignments })

export const buildTypeVariableAssignment = (
  typeVariables: TypeVariable[],
  type?: ResolvedType,
): TypeVariableAssignment => ({
  typeVariables,
  type,
})

export const buildDeferredTypeVariableAssignment = (
  typeVariable: TypeVariable,
  bindings: TermBinding[],
): DeferredTypeVariableAssignment => ({
  typeVariable,
  bindings,
})
