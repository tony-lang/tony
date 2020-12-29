import { ConstrainedType, Type } from '../types/type_inference/types'

/**
 * Given a set of types, return the least general type such that all types in
 * the set are instances of that type.
 */
export const generalize = (
  ...types: ConstrainedType<Type>[]
): ConstrainedType<Type> => {}
