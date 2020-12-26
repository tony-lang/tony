import {
  ConstrainedType,
  TypeConstraints,
  TypeVariable,
  buildConstrainedType,
  buildTypeVariable,
} from '../types/type_inference/types'

export const buildUnconstrainedUnknownType = (): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildTypeVariable())

export const buildConstrainedUnknownType = (
  constraints: TypeConstraints,
): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildTypeVariable(), constraints)
