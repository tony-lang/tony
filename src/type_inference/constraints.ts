import {
  ConstrainedType,
  Type,
  TypeConstraints,
  TypeKind,
  TypeVariable,
  TypeVariableAssignment,
  buildConstrainedType,
} from '../types/type_inference/types'
import { TypedTermBinding } from '../types/analyze/bindings'
import { unify } from './unification'

/**
 * Given a set of constraints, obtains a most general set of type constraints by
 * unifying all shared constraints.
 */
export const unifyConstraints = (
  ...constraints: TypeConstraints[]
): TypeConstraints =>
  constraints.reduce(
    (acc, constraints) =>
      constraints.reduce((acc, constraint) => {
        const matchingConstraint = getConstraintOf(acc, constraint.typeVariable)
        if (matchingConstraint === undefined) return [...acc, constraint]

        const newConstraint: TypeVariableAssignment<Type> = {
          typeVariable: constraint.typeVariable,
          type: unify(
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
  type: Type,
  constraints: TypeConstraints,
): Type => {
  switch (type.kind) {
    case TypeKind.Intersection:
    case TypeKind.Parametric:
    case TypeKind.Union:
      return {
        ...type,
        parameters: type.parameters.map((type) =>
          applyConstraints(type, constraints),
        ),
      }
    case TypeKind.NamedVariable:
    case TypeKind.UnnamedVariable:
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
  bindings: TypedTermBinding[],
  constraints: TypeConstraints,
): TypedTermBinding[] => bindings.map(applyConstraintsToBinding(constraints))

const applyConstraintsToBinding = (constraints: TypeConstraints) => (
  binding: TypedTermBinding,
): TypedTermBinding => ({
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
export const flattenConstrainedType = (type: ConstrainedType<Type>): Type =>
  applyConstraints(type.type, type.constraints)

const getConstraintOf = (
  constraints: TypeConstraints,
  typeVariable: TypeVariable,
): TypeVariableAssignment<Type> | undefined =>
  constraints.find((constraint) => constraint.typeVariable === typeVariable)
