import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  TemporaryTypeVariable,
  Type,
  TypeVariable,
  buildTemporaryTypeVariable,
} from '../types/type_inference/types'

export const buildUnconstrainedUnknownType = <
  T extends Type
>(): ConstrainedType<TemporaryTypeVariable, T> =>
  buildConstrainedType(buildTemporaryTypeVariable())

export const buildConstrainedUnknownType = <T extends Type>(
  constraints: TypeConstraints<T>,
): ConstrainedType<TemporaryTypeVariable, T> =>
  buildConstrainedType(buildTemporaryTypeVariable(), constraints)

export const buildTypeConstraintsFromType = <T extends Type>(
  typeVariable: TypeVariable,
  type: T,
): TypeConstraints<T> =>
  buildTypeConstraints([buildTypeVariableAssignment([typeVariable], type)])
