import { ResolvedType, Type } from './categories'
import { TermBinding } from '../analyze/bindings'
import { TypeVariable } from './types'

// ---- Types ----

/**
 * A set of assignments of type variables to their most general type.
 */
export type Constraints<T extends Type = ResolvedType> = {
  readonly assignments: TypeVariableAssignment<T>[]
  readonly deferredAssignments: DeferredTypeVariableAssignment[]
}

/**
 * Maps a set of type variables to their most general type (if any).
 */
export type TypeVariableAssignment<T extends Type = ResolvedType> = {
  readonly typeVariables: TypeVariable[]
  readonly type?: T
}

/**
 * Maps a type variable to a set of bindings stating that the type variable must
 * take one of their types. The check is deferred until the type of all bindings
 * was determined.
 */
export type DeferredTypeVariableAssignment = {
  readonly typeVariable: TypeVariable
  readonly bindings: TermBinding[]
}

// ---- Factories ----

export const buildConstraints = <T extends Type = ResolvedType>(
  assignments: TypeVariableAssignment<T>[] = [],
  deferredAssignments: DeferredTypeVariableAssignment[] = [],
): Constraints<T> => ({ assignments, deferredAssignments })

export const buildTypeVariableAssignment = <T extends Type = ResolvedType>(
  typeVariables: TypeVariable[],
  type?: T,
): TypeVariableAssignment<T> => ({
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
