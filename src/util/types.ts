import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
} from '../types/type_inference/constraints'
import {
  DeclaredType,
  Type,
  TypeVariable,
  buildTypeVariable,
} from '../types/type_inference/types'
import { unifyConstraints } from '../type_inference/constraints'

export const buildUnconstrainedUnknownType = <
  T extends Type
>(): ConstrainedType<TypeVariable, T> =>
  buildConstrainedType(buildTypeVariable())

export const buildConstrainedUnknownType = <T extends Type>(
  constraints: TypeConstraints<T>,
): ConstrainedType<TypeVariable, T> =>
  buildConstrainedType(buildTypeVariable(), constraints)

export const buildConstrainedUnknownTypeFromTypes = <T extends Type>(
  types: T[],
): ConstrainedType<TypeVariable, T> => {
  const typeVariable = buildTypeVariable()
  return buildConstrainedType(
    typeVariable,
    types.map((type) => ({ typeVariable, type })),
  )
}

export const reduceConstraintTypes = <
  T extends DeclaredType | Type,
  U extends Type
>(
  ...constrainedTypes: ConstrainedType<T, U>[]
): [types: T[], constraints: TypeConstraints<U>] => [
  constrainedTypes.map((constrainedType) => constrainedType.type),
  unifyConstraints(
    ...constrainedTypes.map((constrainedType) => constrainedType.constraints),
  ),
]
