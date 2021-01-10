import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
  buildTypeVariableAssignment,
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
