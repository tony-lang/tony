import {
  ConstrainedType,
  Type,
  buildConstrainedType,
} from '../types/type_inference/types'
import { flattenConstrainedType, unifyConstraints } from './constraints'

/**
 * Given a set of types, return the most general type such that all types in
 * the set are instances of that type.
 */
export const unify = (
  ...types: ConstrainedType<Type>[]
): ConstrainedType<Type> => {
  const constrainedType = unconstrainedUnify(types.map(flattenConstrainedType))
  const unifiedConstraints = unifyConstraints(
    constrainedType.constraints,
    ...types.map((type) => type.constraints),
  )
  return buildConstrainedType(constrainedType.type, unifiedConstraints)
}

const unconstrainedUnify = (types: Type[]): ConstrainedType<Type> => {}
