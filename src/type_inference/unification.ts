import { ResolvedType, Type } from '../types/type_inference/categories'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'
import {
  TypeConstraints,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  TypeKind,
  TypeVariable,
  buildIntersectionType,
  buildTemporaryTypeVariable,
} from '../types/type_inference/types'
import { buildTypeConstraintsFromType, flattenType } from '../util/types'
import { normalize } from './normalization'
import { unifyConstraints } from './constraints'

type State = {
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
}

type ReturnType<T extends Type> = [type: T, constraints: TypeConstraints]

/**
 * Given a set of types, return the least general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends State>(
  state: T,
  ...types: Type[]
): ReturnType<ResolvedType> =>
  types.reduce<ReturnType<ResolvedType>>(
    ([left, constraints], right) => {
      const [type, constraintsAfterUnify] = concreteUnify(state, left, right)
      const newConstraints = unifyConstraints(
        state,
        constraints,
        constraintsAfterUnify,
      )
      const normalizedType = normalize(state, type)
      return [normalizedType, newConstraints]
    },
    [buildTemporaryTypeVariable(), buildTypeConstraints()],
  )

const concreteUnify = <T extends State>(
  state: T,
  left: Type,
  right: Type,
): ReturnType<Type> => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(state, left, right)
    case TypeKind.TemporaryVariable:
      return [right, buildTypeConstraints()]
    default:
      return [
        flattenType(buildIntersectionType([left, right])),
        buildTypeConstraints(),
      ]
  }
}

const unifyWithTypeVariable = <T extends State>(
  state: T,
  left: TypeVariable,
  right: Type,
): ReturnType<Type> => {
  if (right.kind === TypeKind.Variable)
    return [
      left,
      buildTypeConstraints([buildTypeVariableAssignment([left, right])]),
    ]
  return [right, buildTypeConstraintsFromType(left, normalize(state, right))]
}
