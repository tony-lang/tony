import {
  ConstrainedType,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  TemporaryTypeVariable,
  Type,
  TypeKind,
  TypeVariable,
} from '../types/type_inference/types'
import {
  buildTypeConstraintsFromTypes,
  buildUnconstrainedUnknownType,
} from '../util/types'
import { ScopeWithErrors } from '../types/analyze/scopes'
import { unifyConstraints } from './constraints'

type State = {
  scopes: ScopeWithErrors[]
}

/**
 * Given a set of types, return the most general type such that all types in
 * the set are instances of that type.
 */
export const unify = <T extends State, U extends Type>(
  state: T,
  ...types: U[]
): ConstrainedType<U | TemporaryTypeVariable> =>
  types.reduce<ConstrainedType<U | TemporaryTypeVariable>>((left, right) => {
    const constrainedType = unconstrainedConcreteUnify(
      state,
      left.type,
      right,
    ) as ConstrainedType<U>
    const constraints = unifyConstraints(
      state,
      left.constraints,
      constrainedType.constraints,
    )
    return buildConstrainedType(constrainedType.type, constraints)
  }, buildUnconstrainedUnknownType())

const unconstrainedConcreteUnify = <T extends State>(
  state: T,
  left: Type,
  right: Type,
): ConstrainedType<Type> => {
  switch (left.kind) {
    case TypeKind.Variable:
      return unifyWithTypeVariable(left, right)
    case TypeKind.TemporaryVariable:
      return buildConstrainedType(right)
  }
}

const unifyWithTypeVariable = (left: TypeVariable, right: Type) => {
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
