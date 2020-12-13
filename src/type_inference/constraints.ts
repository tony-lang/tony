import {
  ConstrainedType,
  Type,
  TypeConstraints,
} from '../types/type_inference/types'

/**
 * Given a set of constraints, obtains a most general set of type constraints by
 * unifying all shared constraints.
 */
export const unifyConstraints = (
  constraints: TypeConstraints[],
): TypeConstraints => {}

/**
 * Given a type and constraints, applies the constraints to the type to obtain
 * the most general type under the given constraints.
 */
export const applyConstraints = <T extends Type>(
  type: T,
  constraints: TypeConstraints,
): ConstrainedType<T> => {}
