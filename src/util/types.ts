import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
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

export const buildTypeConstraintsFromTypes = <T extends Type>(
  typeVariable: TypeVariable,
  constraints: T[] = [],
): TypeConstraints<T> =>
  constraints.map((constraint) =>
    buildTypeVariableAssignment([typeVariable], constraint),
  )
