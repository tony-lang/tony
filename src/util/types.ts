import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  DeclaredType,
  TemporaryTypeVariable,
  Type,
  TypeVariable,
  buildTemporaryTypeVariable,
} from '../types/type_inference/types'
import { unifyConstraints } from '../type_inference/constraints'

export const buildUnconstrainedUnknownType = <
  T extends Type
>(): ConstrainedType<TemporaryTypeVariable, T> =>
  buildConstrainedType(buildTemporaryTypeVariable())

export const buildConstrainedUnknownType = <T extends Type>(
  constraints: TypeConstraints<T>,
): ConstrainedType<TemporaryTypeVariable, T> =>
  buildConstrainedType(buildTemporaryTypeVariable(), constraints)

export const buildTypeConstraintsFromTypes = <T extends Type>(
  typeVariable: TypeVariable,
  constraints: T[] = [],
): TypeConstraints<T> =>
  constraints.map((constraint) =>
    buildTypeVariableAssignment([typeVariable], constraint),
  )

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
