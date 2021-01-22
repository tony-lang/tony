import {
  Constraints,
  DeferredTypeVariableAssignment,
  buildConstraints,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import {
  IntersectionType,
  RefinedTerm,
  RefinedType,
  TypeKind,
  TypeVariable,
  UnionType,
  buildRefinedTerm,
  buildRefinedType,
} from '../types/type_inference/types'
import {
  buildBindingValue,
  buildEqualityPredicate,
  buildLiteralValue,
} from '../types/type_inference/predicates'
import { Literal } from '../types/type_inference/primitive_types'
import { Type } from '../types/type_inference/categories'

export const buildConstraintsFromType = <T extends Type>(
  typeVariable: TypeVariable,
  type: T,
  deferredAssignments: DeferredTypeVariableAssignment[] = [],
): Constraints<T> => {
  if (type.kind === TypeKind.Variable)
    return buildConstraints(
      [buildTypeVariableAssignment([typeVariable, type as TypeVariable])],
      deferredAssignments,
    )
  return buildConstraints(
    [buildTypeVariableAssignment([typeVariable], type)],
    deferredAssignments,
  )
}

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
