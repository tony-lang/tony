import {
  ConstrainedType,
  Type,
  TypeConstraints,
  TypeVariable,
  TypeVariableAssignment,
  buildConstrainedType,
} from '../types/type_inference/types'
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
export const applyConstraints = <T extends Type>(
  type: T,
  constraints: TypeConstraints,
): T => {}

export const flattenConstrainedType = <T extends Type>(
  type: ConstrainedType<T>,
): T => applyConstraints(type.type, type.constraints)

const getConstraintOf = (
  constraints: TypeConstraints,
  typeVariable: TypeVariable,
): TypeVariableAssignment<Type> | undefined =>
  constraints.find((constraint) => constraint.typeVariable === typeVariable)
