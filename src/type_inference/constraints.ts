import { Answers, buildAnswer } from '../types/type_inference/answers'
import {
  Constraints,
  DeferredTypeVariableAssignment,
  TypeVariableAssignment,
  buildTypeVariableAssignment,
} from '../types/type_inference/constraints'
import { Property, TypeKind, TypeVariable } from '../types/type_inference/types'
import { filterUnique, isNotUndefined } from '../util'
import { mapAnswers, reduceAnswers } from '../util/answers'
import { AbstractState } from '../types/state'
import { ResolvedType } from '../types/type_inference/categories'
import { unify } from './unification'

/**
 * Given a set of constraints, obtains a most general set of type constraints by
 * unifying all shared constraints.
 */
export const unifyConstraints = <T extends AbstractState>(
  state: T,
  ...constraints: Constraints[]
): Answers<T, { constraints: Constraints }> => {
  const deferredAssignments = mergeDeferredAssignments(
    ...constraints.map(({ deferredAssignments }) => deferredAssignments),
  )
  return mapAnswers(
    unifyAssignments(
      state,
      ...constraints.map(({ assignments }) => assignments),
    ),
    ({ state, assignments }) => [
      buildAnswer(state, { constraints: { assignments, deferredAssignments } }),
    ],
  )
}

const unifyAssignments = <T extends AbstractState>(
  state: T,
  ...assignments: TypeVariableAssignment[][]
) =>
  reduceAnswers<
    T,
    { assignments: TypeVariableAssignment[] },
    TypeVariableAssignment
  >(
    assignments.flat(),
    ({ state, assignments }, assignment) => {
      const matchingAssignments = getOverlappingAssignments(
        assignments,
        assignment.typeVariables,
      )
      if (matchingAssignments.length === 0)
        return [
          buildAnswer(state, { assignments: [...assignments, assignment] }),
        ]

      return mapAnswers(
        mergeAssignments(state, [assignment, ...matchingAssignments]),
        ({ state, assignment }) => [
          buildAnswer(state, {
            assignments: [
              ...assignments.filter(
                (assignment) => !matchingAssignments.includes(assignment),
              ),
              assignment,
            ],
          }),
        ],
      )
    },
    [buildAnswer(state, { assignments: [] })],
  )

const mergeAssignments = <T extends AbstractState>(
  state: T,
  assignments: TypeVariableAssignment[],
) => {
  const typeVariables = filterUnique(
    assignments.map((assignment) => assignment.typeVariables).flat(1),
  )
  const types = assignments
    .map((assignment) => (assignment.type ? assignment.type : undefined))
    .filter(isNotUndefined)
  // disregard updated constraints from unification
  return mapAnswers(unify(state, ...types), ({ state, type }) => [
    buildAnswer(state, {
      assignment: buildTypeVariableAssignment(typeVariables, type),
    }),
  ])
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
  constraints: Constraints,
): ResolvedType => {
  switch (type.kind) {
    case TypeKind.Class:
      return {
        ...type,
        members: type.members.map((member) =>
          applyConstraintsToProperty(member, constraints),
        ),
      }
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
  constraints: Constraints,
) => ({
  key: applyConstraints(property.key, constraints),
  value: applyConstraints(property.value, constraints),
})

const getConstraintOf = (
  constraints: Constraints,
  typeVariable: TypeVariable,
) =>
  constraints.assignments.find((constraint) =>
    constraint.typeVariables.includes(typeVariable),
  )

const getOverlappingAssignments = (
  assignments: TypeVariableAssignment[],
  typeVariables: TypeVariable[],
) =>
  assignments.filter((assignment) =>
    typeVariables.some((typeVariable) =>
      assignment.typeVariables.includes(typeVariable),
    ),
  )
