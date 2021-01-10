import {
  ConstrainedType,
  ResolvedConstrainedType,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  ResolvedType,
  Type,
  TypeKind,
  TypeVariable,
} from '../types/type_inference/types'
import {
  buildTypeConstraintsFromTypes,
  buildUnconstrainedUnknownType,
} from '../util/types'
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

const unconstrainedUnify = (types: ResolvedType[]) =>
  types.reduce<ResolvedConstrainedType>((left, right) => {
    const constrainedType = unconstrainedConcreteUnify(left.type, right)
    const constraints = unifyConstraints(
      left.constraints,
      constrainedType.constraints,
    )
    return buildConstrainedType(constrainedType.type, constraints)
  }, buildUnconstrainedUnknownType())

const unconstrainedConcreteUnify = (
  left: ResolvedType,
  right: ResolvedType,
): ResolvedConstrainedType => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(left, right)
  }
}

const unifyWithTypeVariable = (
  left: TypeVariable,
  right: ResolvedType,
): ResolvedConstrainedType => {
  if (right.kind === TypeKind.Variable)
    return buildConstrainedType(
      left,
      buildTypeConstraints([buildTypeVariableAssignment([left, right])]),
    )
  return buildConstrainedType(
    right,
    buildTypeConstraintsFromTypes(left, [right]),
  )
}
