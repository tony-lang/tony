import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  IntersectionType,
  TemporaryTypeVariable,
  Type,
  TypeVariable,
  UnionType,
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

export const flattenType = <T extends UnionType | IntersectionType>(
  type: T,
): T => ({
  ...type,
  parameters: type.parameters.reduce<Type[]>((parameters, parameter) => {
    if (parameter.kind !== type.kind) return [...parameters, parameter]
    const flattenedParameter = flattenType(parameter)
    return [...parameters, ...flattenedParameter.parameters]
  }, []),
})
