import { DeclaredType, ResolvedType, Type, TypeVariable } from './types'

// ---- Types ----

/**
 * A constrained type represents a type alongside constraints on type variables.
 */
export type ConstrainedType<T extends DeclaredType | Type, U extends Type> = {
  type: T
  constraints: TypeConstraints<U>
}
export type ResolvedConstrainedType = ConstrainedType<
  ResolvedType,
  ResolvedType
>

/**
 * A set of assignments of type variables to their most general type.
 */
export type TypeConstraints<T extends Type> = TypeVariableAssignment<T>[]

/**
 * Maps a set of type variables to their most general type (if any).
 */
export type TypeVariableAssignment<T extends Type = Type> = {
  typeVariables: TypeVariable[]
  type?: T
}

// ---- Factories ----

export const buildConstrainedType = <
  T extends DeclaredType | Type,
  U extends Type
>(
  type: T,
  constraints: TypeConstraints<U> = [],
): ConstrainedType<T, U> => ({
  type,
  constraints,
})

export const buildTypeConstraints = <T extends Type>(
  constraints: TypeVariableAssignment<T>[] = [],
): TypeConstraints<T> => constraints

export const buildTypeVariableAssignment = <T extends Type>(
  typeVariables: TypeVariable[],
  type?: T,
): TypeVariableAssignment<T> => ({
  typeVariables,
  type,
})
