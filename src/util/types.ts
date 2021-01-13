import {
  ConstrainedType,
  TypeConstraints,
  buildConstrainedType,
  buildTypeConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
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
import { ResolvedType, Type } from '../types/type_inference/categories'
import {
  buildBindingValue,
  buildEqualityPredicate,
  buildLiteralValue,
} from '../types/type_inference/predicates'
import { Literal } from '../types/type_inference/primitive_types'

export const buildUnconstrainedUnknownType = (): ConstrainedType<TemporaryTypeVariable> =>
  buildConstrainedType(buildTemporaryTypeVariable())

export const buildConstrainedUnknownType = (
  constraints: TypeConstraints,
): ConstrainedType<TemporaryTypeVariable> =>
  buildConstrainedType(buildTemporaryTypeVariable(), constraints)

export const buildTypeConstraintsFromType = (
  typeVariable: TypeVariable,
  type: ResolvedType,
): TypeConstraints =>
  buildTypeConstraints([buildTypeVariableAssignment([typeVariable], type)])

export const buildLiteralType = (value: Literal): RefinedType<RefinedTerm> =>
  buildRefinedType(buildRefinedTerm('value'), [
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
