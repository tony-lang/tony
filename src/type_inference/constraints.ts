import {
  ConstrainedType,
  Type,
  TypeConstraints,
  TypeKind,
  TypeVariable,
  TypeVariableAssignment,
  buildConstrainedType,
} from '../types/type_inference/types'
import {
  TypedBindings,
  TypedTermBinding,
  TypedTypeBinding,
  buildTypedBindings,
  getTerms,
  getTypes,
} from '../types/analyze/bindings'
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
    case TypeKind.Alias:
    case TypeKind.Refined:
      return { ...type, type: applyConstraints(type.type, constraints) }
    case TypeKind.Object:
      return {
        ...type,
        typedBindings: applyConstraintsToBindings(
          type.typedBindings,
          constraints,
        ),
      }
    case TypeKind.Parametric:
      return {
        ...type,
        parameters: type.parameters.map((type) =>
          applyConstraints(type, constraints),
        ),
      }
    case TypeKind.Primitive:
      return type
    case TypeKind.Variable:
      return getConstraintOf(constraints, type)?.type || type
  }
}

const applyConstraintsToBindings = (
  bindings: TypedBindings,
  constraints: TypeConstraints,
): TypedBindings =>
  buildTypedBindings(
    getTerms<TypedTermBinding>(bindings).map(
      applyConstraintsToBinding(constraints),
    ),
    getTypes<TypedTypeBinding>(bindings).map(
      applyConstraintsToBinding(constraints),
    ),
  )

const applyConstraintsToBinding = <T extends { type: ConstrainedType<Type> }>(
  constraints: TypeConstraints,
) => (binding: T): T => ({
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
