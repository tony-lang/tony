import { ConstrainedType, Type } from '../types/type_inference/types'
import { applyConstraints } from './constraints'

/**
 * Given a set of types, return the most general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends Type>(
  ...types: ConstrainedType<T>[]
): ConstrainedType<T> =>
  unconstrainedUnify(
    types.map((type) => applyConstraints(type.type, type.constraints)),
  )

const unconstrainedUnify = <T extends Type>(
  types: T[],
): ConstrainedType<T> => {}
