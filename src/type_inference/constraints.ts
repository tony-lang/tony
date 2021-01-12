import {
  Property,
  ResolvedType,
  TemporaryTypeVariable,
  Type,
  TypeKind,
  TypeVariable,
} from '../types/type_inference/types'
import {
  ResolvedConstrainedType,
  TypeConstraints,
  TypeVariableAssignment,
} from '../types/type_inference/constraints'
import { filterUnique, isNotUndefined } from '../util'
import { ScopeWithErrors } from '../types/analyze/scopes'
import { unify } from './unification'

type State = {
  scopes: ScopeWithErrors[]
}

/**
 * Given a set of constraints, obtains a most general set of type constraints by
 * unifying all shared constraints.
 *
 * @param U must either be ResolvedType or UnresolvedType
 */
export const unifyConstraints = <T extends State, U extends Type>(
  state: T,
  ...constraints: TypeConstraints<U>[]
): TypeConstraints<U | TemporaryTypeVariable> =>
  constraints.reduce<TypeConstraints<U | TemporaryTypeVariable>>(
    (acc, constraints) =>
      constraints.reduce((acc, constraint) => {
        const matchingConstraints = getOverlappingConstraints(
          acc,
          constraint.typeVariables,
        )
        if (matchingConstraints.length === 0) return [...acc, constraint]

        const newConstraint = mergeTypeVariableAssignments(state, [
          constraint,
          ...matchingConstraints,
        ])
        return [
          ...acc.filter(
            (constraint) => !matchingConstraints.includes(constraint),
          ),
          newConstraint,
        ]
      }, acc),
    [],
  )

const mergeTypeVariableAssignments = <T extends State, U extends Type>(
  state: T,
  typeVariableAssignments: TypeVariableAssignment<U>[],
): TypeVariableAssignment<U | TemporaryTypeVariable> => {
  const typeVariables = filterUnique(
    typeVariableAssignments
      .map((typeVariableAssignment) => typeVariableAssignment.typeVariables)
      .flat(1),
  )
  const types = typeVariableAssignments
    .map((typeVariableAssignment) =>
      typeVariableAssignment.type ? typeVariableAssignment.type : undefined,
    )
    .filter(isNotUndefined)
  const type = unify(state, ...types).type
  return {
    typeVariables,
    type,
  }
}

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

    case TypeKind.TemporaryVariable:
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
  constraints.find((constraint) =>
    constraint.typeVariables.includes(typeVariable),
  )

const getOverlappingConstraints = <T extends Type>(
  constraints: TypeConstraints<T>,
  typeVariables: TypeVariable[],
): TypeVariableAssignment<T>[] =>
  constraints.filter((constraint) =>
    typeVariables.some((typeVariable) =>
      constraint.typeVariables.includes(typeVariable),
    ),
  )
