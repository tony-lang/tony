import {
  ConstrainedType,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  TemporaryTypeVariable,
  TypeKind,
  TypeVariable,
  buildIntersectionType,
} from '../types/type_inference/types'
import {
  buildTypeConstraintsFromType,
  buildUnconstrainedUnknownType,
  flattenType,
} from '../util/types'
import { ScopeWithErrors } from '../types/analyze/scopes'
import { normalize } from './normalization'
import { unifyConstraints } from './constraints'
import {
  ResolvedType,
  Type,
  TypeCategory,
  TypeOfCategory,
} from '../types/type_inference/categories'

type State = {
  scopes: ScopeWithErrors[]
}

/**
 * Given a set of types, return the least general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends State, U extends Type>(
  state: T,
  ...types: U[]
): ConstrainedType<U | TemporaryTypeVariable> =>
  types.reduce<ConstrainedType<U | TemporaryTypeVariable>>(
    (left, right) => {
      const constrainedType = concreteUnify(
        state,
        left.type,
        right,
      )
      const constraints = unifyConstraints(
        state,
        left.constraints,
        constrainedType.constraints,
      )
      return buildConstrainedType(constrainedType.type, constraints)
    },
    buildUnconstrainedUnknownType(),
  )

const concreteUnify = <T extends State, U extends Type>(
  state: T,
  left: U,
  right: U,
): ConstrainedType<U> => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(left, right)
    case TypeKind.TemporaryVariable:
      return buildConstrainedType(right)
    default:
      return normalize(
        state,
        buildConstrainedType(
          buildUnresolvedType(
            flattenType(buildIntersectionType([left, right])),
          ),
        ),
      )
  }
}

const unifyWithTypeVariable = (left: TypeVariable, right: Type) => {
  if (right.kind === TypeKind.Variable)
    return buildConstrainedType(
      buildResolvedType(left),
      buildTypeConstraints([buildTypeVariableAssignment([left, right])]),
    )
  return buildConstrainedType(right, buildTypeConstraintsFromType(left, right))
}
