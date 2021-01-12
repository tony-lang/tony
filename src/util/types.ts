import {
  Resolved,
  Type,
  buildResolvedType,
} from '../types/type_inference/categories'
import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  buildBindingValue,
  buildEqualityPredicate,
  buildLiteralValue,
} from '../types/type_inference/predicates'
import { Literal } from '../types/type_inference/primitive_types'
import {
  IntersectionType,
  RefinedTerm,
  RefinedType,
  TemporaryTypeVariable,
  TypeVariable,
  UnionType,
  buildRefinedTerm,
  buildRefinedType,
  buildTemporaryTypeVariable,
} from '../types/type_inference/types'

export const buildUnconstrainedUnknownType = <
  T extends Type
>(): ConstrainedType<Resolved<TemporaryTypeVariable>, T> =>
  buildConstrainedType(buildResolvedType(buildTemporaryTypeVariable()))

export const buildConstrainedUnknownType = <T extends Type>(
  constraints: TypeConstraints<T>,
): ConstrainedType<Resolved<TemporaryTypeVariable>, T> =>
  buildConstrainedType(
    buildResolvedType(buildTemporaryTypeVariable()),
    constraints,
  )

export const buildTypeConstraintsFromType = <T extends Type>(
  typeVariable: TypeVariable,
  type: T,
): TypeConstraints<T> =>
  buildTypeConstraints([buildTypeVariableAssignment([typeVariable], type)])

export const buildLiteralType = (
  value: Literal,
): RefinedType<Resolved<RefinedTerm>> =>
  buildRefinedType(buildResolvedType(buildRefinedTerm('value')), [
    buildEqualityPredicate(
      buildBindingValue('value'),
      buildLiteralValue(value),
    ),
  ])

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
