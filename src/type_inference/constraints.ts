import {
  DeferredTypeVariableAssignment,
  TypeConstraints,
  TypeVariableAssignment,
} from '../types/type_inference/constraints'
import { Property, TypeKind, TypeVariable } from '../types/type_inference/types'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'
import { filterUnique, isNotUndefined } from '../util'
import { ResolvedType } from '../types/type_inference/categories'
import { unify } from './unification'

type State = {
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
}

/**
 * Given a set of constraints, obtains a most general set of type constraints by
 * unifying all shared constraints.
 */
export const unifyConstraints = <T extends State>(
  state: T,
  ...constraints: TypeConstraints[]
): [newState: T, constraints: TypeConstraints] => {
  const [newState, assignments] = unifyAssignments(
    state,
    ...constraints.map(({ assignments }) => assignments),
  )
  const deferredAssignments = mergeDeferredAssignments(
    ...constraints.map(({ deferredAssignments }) => deferredAssignments),
  )
  return [newState, { assignments, deferredAssignments }]
}

const unifyAssignments = <T extends State>(
  state: T,
  ...assignments: TypeVariableAssignment[][]
): [newState: T, assignments: TypeVariableAssignment[]] =>
  assignments.reduce<[newState: T, assignments: TypeVariableAssignment[]]>(
    (acc, assignments) =>
      assignments.reduce(([state, assignments], assignment) => {
        const matchingAssignments = getOverlappingAssignments(
          assignments,
          assignment.typeVariables,
        )
        if (matchingAssignments.length === 0)
          return [state, [...assignments, assignment]]

        const [newState, newConstraint] = mergeTypeVariableAssignments(state, [
          assignment,
          ...matchingAssignments,
        ])
        return [
          newState,
          [
            ...assignments.filter(
              (assignment) => !matchingAssignments.includes(assignment),
            ),
            newConstraint,
          ],
        ]
      }, acc),
    [state, []],
  )

const mergeTypeVariableAssignments = <T extends State>(
  state: T,
  typeVariableAssignments: TypeVariableAssignment[],
): [newState: T, typeVariableAssignment: TypeVariableAssignment] => {
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
  // disregard updated constraints from unification
  const [stateAfterUnify, type] = unify(state, ...types)
  return [
    stateAfterUnify,
    {
      typeVariables,
      type,
    },
  ]
}

/**
 * Merge multiple disjunct sets of deferred type variable assignments into one.
 */
export const mergeDeferredAssignments = (
  ...deferredAssignments: DeferredTypeVariableAssignment[][]
): DeferredTypeVariableAssignment[] => deferredAssignments.flat()

/**
 * Given a type and constraints, applies the constraints to the type to obtain
 * the most general type under the given constraints.
 */
export const applyConstraints = (
  type: ResolvedType,
  constraints: TypeConstraints,
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
    case TypeKind.Interface:
      return {
        ...type,
        members: type.members.map((member) =>
          applyConstraintsToProperty(member, constraints),
        ),
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
  property: Property<ResolvedType>,
  constraints: TypeConstraints,
): Property<ResolvedType> => ({
  key: applyConstraints(property.key, constraints),
  value: applyConstraints(property.value, constraints),
})

const getConstraintOf = (
  constraints: TypeConstraints,
  typeVariable: TypeVariable,
): TypeVariableAssignment | undefined =>
  constraints.assignments.find((constraint) =>
    constraint.typeVariables.includes(typeVariable),
  )

const getOverlappingAssignments = (
  assignments: TypeVariableAssignment[],
  typeVariables: TypeVariable[],
): TypeVariableAssignment[] =>
  assignments.filter((assignment) =>
    typeVariables.some((typeVariable) =>
      assignment.typeVariables.includes(typeVariable),
    ),
  )
