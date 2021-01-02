import {
  ResolvedConstrainedType,
  ResolvedType,
  Type,
  TypeConstraints,
  TypeKind,
  TypeVariable,
  TypeVariableAssignment,
  buildConstrainedType,
} from '../types/type_inference/types'
import { TypedTermBinding } from '../types/analyze/bindings'
import { unifyUnresolved } from './unification'

/**
 * Given a set of constraints, obtains a most general set of type constraints by
 * unifying all shared constraints.
 */
export const unifyConstraints = <T extends Type>(
  ...constraints: TypeConstraints<T>[]
): TypeConstraints<T> =>
  constraints.reduce(
    (acc, constraints) =>
      constraints.reduce((acc, constraint) => {
        const matchingConstraint = getConstraintOf(acc, constraint.typeVariable)
        if (matchingConstraint === undefined) return [...acc, constraint]

        const newConstraint: TypeVariableAssignment<T> = {
          typeVariable: constraint.typeVariable,
          type: unifyUnresolved(
            buildConstrainedType(matchingConstraint.type, acc),
            buildConstrainedType(constraint.type, constraints),
          ).type,
        }
        return [
          ...acc.filter((constraint) => constraint !== matchingConstraint),
          newConstraint,
        ]
      }, acc),
    [],
  )

/**
 * Given a type and constraints, applies the constraints to the type to obtain
 * the most general type under the given constraints.
 */
export const applyConstraints = (
  type: ResolvedType,
  constraints: TypeConstraints<ResolvedType>,
): ResolvedType => {
  switch (type.kind) {
    case TypeKind.Curried:
      return {
        ...type,
        from: applyConstraints(type.from, constraints),
        to: applyConstraints(type.to, constraints),
      }
    case TypeKind.Intersection:
    case TypeKind.Union:
      return {
        ...type,
        parameters: type.parameters.map((type) =>
          applyConstraints(type, constraints),
        ),
      }
    case TypeKind.Map:
      return {
        ...type,
        key: applyConstraints(type.key, constraints),
        value: applyConstraints(type.value, constraints),
      }
    case TypeKind.Variable:
      return getConstraintOf(constraints, type)?.type || type
    case TypeKind.Object:
      return {
        ...type,
        typedBindings: applyConstraintsToBindings(
          type.typedBindings,
          constraints,
        ),
      }
    case TypeKind.Refined:
    case TypeKind.Tagged:
      return { ...type, type: applyConstraints(type.type, constraints) }

    case TypeKind.Boolean:
    case TypeKind.Number:
    case TypeKind.RegExp:
    case TypeKind.String:
    case TypeKind.Void:
      return type
  }
}

const applyConstraintsToBindings = (
  bindings: TypedTermBinding<ResolvedType>[],
  constraints: TypeConstraints<ResolvedType>,
): TypedTermBinding<ResolvedType>[] =>
  bindings.map(applyConstraintsToBinding(constraints))

const applyConstraintsToBinding = (
  constraints: TypeConstraints<ResolvedType>,
) => (
  binding: TypedTermBinding<ResolvedType>,
): TypedTermBinding<ResolvedType> => ({
  ...binding,
  type: buildConstrainedType(
    applyConstraints(
      binding.type.type,
      unifyConstraints(constraints, binding.type.constraints),
    ),
    binding.type.constraints,
  ),
})

/**
 * Applies a constrained type to its constraints.
 */
export const flattenConstrainedType = (
  type: ResolvedConstrainedType,
): ResolvedType => applyConstraints(type.type, type.constraints)

const getConstraintOf = <T extends Type>(
  constraints: TypeConstraints<T>,
  typeVariable: TypeVariable,
): TypeVariableAssignment<T> | undefined =>
  constraints.find((constraint) => constraint.typeVariable === typeVariable)
