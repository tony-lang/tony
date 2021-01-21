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

type ReturnType<T extends State, U extends Type> = [
  newState: T,
  type: U,
  constraints: TypeConstraints,
]

/**
 * Given a set of types, return the least general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends State>(
  state: T,
  ...types: Type[]
): ReturnType<T, ResolvedType>[] =>
  types.reduce<ReturnType<T, ResolvedType>[]>(
    ([state, left, constraints], right) => {
      const [stateAfterUnify, type, constraintsAfterUnify] = concreteUnify(
        state,
        left,
        right,
      )
      const [stateAfterUnifyConstraints, newConstraints] = unifyConstraints(
        stateAfterUnify,
        constraints,
        constraintsAfterUnify,
      )
      const [stateAfterNormalize, normalizedType] = normalize(
        stateAfterUnifyConstraints,
        type,
      )
      return [stateAfterNormalize, normalizedType, newConstraints]
    },
    [state, buildTemporaryTypeVariable(), buildTypeConstraints()],
  )

const concreteUnify = <T extends State>(
  state: T,
  left: Type,
  right: Type,
): ReturnType<T, Type> => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(state, left, right)
    case TypeKind.TemporaryVariable:
      return [state, right, buildTypeConstraints()]
    default:
      return [
        state,
        flattenType(buildIntersectionType([left, right])),
        buildTypeConstraints(),
      ]
  }
}

const unifyWithTypeVariable = <T extends State>(
  state: T,
  typeVariable: TypeVariable,
  type: Type,
): ReturnType<T, Type> => {
  if (type.kind === TypeKind.Variable)
    return [
      state,
      typeVariable,
      buildTypeConstraints([buildTypeVariableAssignment([typeVariable, type])]),
    ]
  const [newState, normalizedType] = normalize(state, type)
  return [
    newState,
    normalizedType,
    buildTypeConstraintsFromType(typeVariable, normalizedType),
  ]
}
