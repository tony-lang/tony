import { ConstrainedType, Type } from '../types/type_inference/types'
import { flattenConstrainedType } from './constraints'

/**
 * Given a set of types, return the most general type such that all types in
 * the set are instances of that type.
 */
export const unify = (
  ...types: ConstrainedType<Type>[]
): ConstrainedType<Type> =>
  unconstrainedUnify(types.map(flattenConstrainedType))

const unconstrainedUnify = (types: Type[]): ConstrainedType<Type> => {}
