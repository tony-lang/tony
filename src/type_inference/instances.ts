import { Answers, buildAnswer } from '../types/type_inference/answers'
import {
  Constraints,
  buildConstraints,
} from '../types/type_inference/constraints'
import {
  CurriedType,
  IntersectionType,
  ObjectType,
  Property,
  TypeKind,
  TypeVariable,
  UnionType,
} from '../types/type_inference/types'
import { mapAnswers, reduceAnswers } from '../util/answers'
import { NotImplementedError } from '../types/errors/internal'
import { ResolvedType } from '../types/type_inference/categories'
import { State } from '../types/type_inference/state'
import { buildConstraintsFromType } from '../util/types'
import { unifyConstraints } from './constraints'

type Return = { constraints: Constraints }

const forAll = <T extends State, U>(
  state: T,
  types: U[],
  constraints: Constraints,
  callback: (state: T, type: U, constraints: Constraints) => Answers<T, Return>,
) =>
  reduceAnswers(
    types,
    ({ state, constraints }, type) => callback(state, type, constraints),
    [buildAnswer(state, { constraints })],
  )

const forSome = <T extends State, U>(
  state: T,
  types: U[],
  constraints: Constraints,
  callback: (state: T, type: U, constraints: Constraints) => Answers<T, Return>,
) => types.map((type) => callback(state, type, constraints)).flat()

/**
 * Given a specific type and some general types, determines whether the specific
 * type is an instance of all general types.
 */
export const isInstanceOfAll = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ResolvedType[],
  constraints = buildConstraints(),
): Answers<T, Return> =>
  forAll(state, general, constraints, (state, general, constraints) =>
    isInstanceOf(state, specific, general, constraints),
  )

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type. Returns a list describing all states and
 * sets of type constraints in which the given specific type is an instance of
 * the given general type.
 */
export const isInstanceOf = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ResolvedType,
  constraints = buildConstraints(),
): Answers<T, Return> => {
  if (specific.kind === TypeKind.Variable)
    return typeVariableIsInstanceOf(state, specific, general, constraints)
  else if (
    specific.kind === TypeKind.Intersection ||
    specific.kind === TypeKind.Union
  )
    return isInstanceOfIntersectionOrUnion(
      state,
      specific,
      general,
      constraints,
    )

  switch (general.kind) {
    case TypeKind.Curried:
      return isInstanceOfCurriedType(state, specific, general, constraints)
    case TypeKind.Interface:
      throw new NotImplementedError(
        'Cannot determine assignability to interfaces yet.',
      )
    case TypeKind.Intersection:
    case TypeKind.Union:
      return isInstanceOfIntersectionOrUnion(
        state,
        general,
        specific,
        constraints,
      )
    case TypeKind.Object:
      return isInstanceOfObjectType(state, specific, general, constraints)
    case TypeKind.Refined:
    case TypeKind.RefinedTerm:
      throw new NotImplementedError(
        'Cannot determine assignability to refined types yet.',
      )
    case TypeKind.Variable:
      return typeVariableIsInstanceOf(state, general, specific, constraints)

    case TypeKind.Boolean:
    case TypeKind.Number:
    case TypeKind.RegExp:
    case TypeKind.String:
    case TypeKind.TemporaryVariable:
    case TypeKind.Void:
      return specific === general ? [buildAnswer(state, { constraints })] : []
  }
}

const typeVariableIsInstanceOf = <T extends State>(
  state: T,
  typeVariable: TypeVariable,
  type: ResolvedType,
  constraints: Constraints,
) =>
  mapAnswers(
    unifyConstraints(
      state,
      constraints,
      buildConstraintsFromType(typeVariable, type),
    ),
    ({ state, constraints }) => [buildAnswer(state, { constraints })],
  )

const isInstanceOfIntersectionOrUnion = <T extends State>(
  state: T,
  intersectionOrUnion: IntersectionType<ResolvedType> | UnionType<ResolvedType>,
  type: ResolvedType,
  constraints: Constraints,
) =>
  (intersectionOrUnion.kind === TypeKind.Intersection ? forSome : forAll)(
    state,
    intersectionOrUnion.parameters,
    constraints,
    (state, parameter, constraints) =>
      isInstanceOf(state, parameter, type, constraints),
  )

const isInstanceOfCurriedType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: CurriedType<ResolvedType>,
  constraints: Constraints,
) => {
  if (specific.kind !== TypeKind.Curried) return []
  return mapAnswers(
    isInstanceOf(state, specific.from, general.from, constraints),
    ({ state, constraints }) =>
      isInstanceOf(state, specific.to, general.to, constraints),
  )
}

const isInstanceOfObjectType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ObjectType<ResolvedType>,
  constraints: Constraints,
) => {
  if (specific.kind === TypeKind.Object) {
    return forAll(
      state,
      specific.properties,
      constraints,
      (state, specificProperty, constraints) =>
        forSome(
          state,
          general.properties,
          constraints,
          (state, generalProperty, constraints) =>
            propertyIsInstanceOf(
              state,
              specificProperty,
              generalProperty,
              constraints,
            ),
        ),
    )
  }
  return []
}

const propertyIsInstanceOf = <T extends State>(
  state: T,
  specific: Property<ResolvedType>,
  general: Property<ResolvedType>,
  constraints: Constraints,
) =>
  mapAnswers(
    isInstanceOf(state, specific.key, general.key, constraints),
    ({ state, constraints }) =>
      isInstanceOf(state, specific.value, general.value, constraints),
  )
