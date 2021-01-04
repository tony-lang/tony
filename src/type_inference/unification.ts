import {
  ConstrainedType,
  ResolvedConstrainedType,
  buildConstrainedType,
} from '../types/type_inference/constraints'
import { ResolvedType, Type } from '../types/type_inference/types'
import { flattenConstrainedType, unifyConstraints } from './constraints'

/**
 * Given a set of types, return the most general type such that all types in
 * the set are instances of that type.
 */
export const unifyUnresolved = <T extends Type, U extends Type>(
  ...types: ConstrainedType<T, U>[]
): ConstrainedType<T, U> => {}

/**
 * Given a set of types, return the most general type such that all types in
 * the set are instances of that type.
 */
export const unify = (
  ...types: ResolvedConstrainedType[]
): ResolvedConstrainedType => {
  const constrainedType = unconstrainedUnify(types.map(flattenConstrainedType))
  const unifiedConstraints = unifyConstraints(
    constrainedType.constraints,
    ...types.map((type) => type.constraints),
  )
  return buildConstrainedType(constrainedType.type, unifiedConstraints)
}

const unconstrainedUnify = (
  types: ResolvedType[],
): ResolvedConstrainedType => {}
