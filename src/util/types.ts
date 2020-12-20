import {
  ConstrainedType,
  TypeVariable,
  buildConstrainedType,
  buildTypeVariable,
} from '../types/type_inference/types'

export const buildUnconstrainedUnknownType = (): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildTypeVariable())
