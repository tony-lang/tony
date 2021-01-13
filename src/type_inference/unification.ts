import {
  ConstrainedType,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import { ResolvedType, Type } from '../types/type_inference/categories'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'
import {
  TypeKind,
  TypeVariable,
  buildIntersectionType,
} from '../types/type_inference/types'
import {
  buildTypeConstraintsFromType,
  buildUnconstrainedUnknownType,
  flattenType,
} from '../util/types'
import { normalize } from './normalization'
import { unifyConstraints } from './constraints'

type State = {
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
}

/**
 * Given a set of types, return the least general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends State>(
  state: T,
  ...types: Type[]
): ConstrainedType<ResolvedType> =>
  types.reduce<ConstrainedType<ResolvedType>>((left, right) => {
    const constrainedType = concreteUnify(state, left.type, right)
    const constraints = unifyConstraints(
      state,
      left.constraints,
      constrainedType.constraints,
    )
    const normalizedType = normalize(state, constrainedType.type)
    return buildConstrainedType(normalizedType, constraints)
  }, buildUnconstrainedUnknownType())

const concreteUnify = <T extends State>(
  state: T,
  left: Type,
  right: Type,
): ConstrainedType<Type> => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(state, left, right)
    case TypeKind.TemporaryVariable:
      return buildConstrainedType(right)
    default:
      return buildConstrainedType(
        flattenType(buildIntersectionType([left, right])),
      )
  }
}

const unifyWithTypeVariable = <T extends State>(
  state: T,
  left: TypeVariable,
  right: Type,
) => {
  if (right.kind === TypeKind.Variable)
    return buildConstrainedType(
      left,
      buildTypeConstraints([buildTypeVariableAssignment([left, right])]),
    )
  return buildConstrainedType(
    right,
    buildTypeConstraintsFromType(left, normalize(state, right)),
  )
}
