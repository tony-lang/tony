import {
  Property,
  ResolvedType,
  Type,
  TypeKind,
  TypeVariable,
} from '../types/type_inference/types'
import {
  ResolvedConstrainedType,
  TypeConstraints,
  TypeVariableAssignment,
  buildConstrainedType,
} from '../types/type_inference/constraints'
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
        property: applyConstraintsToProperty(type.property, constraints),
      }
    case TypeKind.Variable:
      return getConstraintOf(constraints, type)?.type || type
    case TypeKind.Object:
      return {
        ...type,
        properties: type.properties.map((property) =>
          applyConstraintsToProperty(property, constraints),
        ),
      }
    case TypeKind.Refined:
      return { ...type, type: applyConstraints(type.type, constraints) }

    case TypeKind.RefinedTerm:
    case TypeKind.Boolean:
    case TypeKind.Number:
    case TypeKind.RegExp:
    case TypeKind.String:
    case TypeKind.Void:
      return type
  }
}

const applyConstraintsToProperty = (
  property: Property<ResolvedType, ResolvedType>,
  constraints: TypeConstraints<ResolvedType>,
): Property<ResolvedType, ResolvedType> => ({
  key: applyConstraints(property.key, constraints),
  value: applyConstraints(property.value, constraints),
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
