import {
  CurriedType,
  IntersectionType,
  MapType,
  ObjectType,
  Property,
  TypeKind,
  TypeVariable,
  UnionType,
  buildProperty,
  buildUnionType,
} from '../types/type_inference/types'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'
import {
  TypeConstraints,
  buildTypeConstraints,
} from '../types/type_inference/constraints'
import { NotImplementedError } from '../types/errors/internal'
import { ResolvedType } from '../types/type_inference/categories'
import { buildTypeConstraintsFromType } from '../util/types'
import { unifyConstraints } from './constraints'

type State = {
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
}

type ReturnType<T extends State> = [newState: T, constraints: TypeConstraints]

const apply = <T extends State>(
  results: ReturnType<T>[],
  callback: (result: ReturnType<T>) => ReturnType<T>[],
): ReturnType<T>[] => results.map((result) => callback(result)).flat()

const forAll = <T extends State, U>(
  state: T,
  types: U[],
  constraints: TypeConstraints,
  callback: (
    state: T,
    type: U,
    constraints: TypeConstraints,
  ) => ReturnType<T>[],
): ReturnType<T>[] => {
  if (types.length === 0) return [[state, constraints]]
  const [type, ...remainingTypes] = types
  const results = callback(state, type, constraints)
  return apply(results, ([newState, newConstraints]) =>
    forAll(newState, remainingTypes, newConstraints, callback),
  )
}

const forSome = <T extends State, U>(
  state: T,
  types: U[],
  constraints: TypeConstraints,
  callback: (
    state: T,
    type: U,
    constraints: TypeConstraints,
  ) => ReturnType<T>[],
): ReturnType<T>[] =>
  types.map((type) => callback(state, type, constraints)).flat()

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
  constraints = buildTypeConstraints(),
): ReturnType<T>[] => {
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
    case TypeKind.Map:
      return isInstanceOfMapType(state, specific, general, constraints)
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
      return specific === general ? [[state, constraints]] : []
  }
}

const typeVariableIsInstanceOf = <T extends State>(
  state: T,
  typeVariable: TypeVariable,
  type: ResolvedType,
  constraints: TypeConstraints,
): ReturnType<T>[] => {
  const [newState, newConstraints] = unifyConstraints(
    state,
    constraints,
    buildTypeConstraintsFromType(typeVariable, type),
  )
  return [[newState, newConstraints]]
}

const isInstanceOfIntersectionOrUnion = <T extends State>(
  state: T,
  intersectionOrUnion: IntersectionType<ResolvedType> | UnionType<ResolvedType>,
  type: ResolvedType,
  constraints: TypeConstraints,
): ReturnType<T>[] =>
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
  constraints: TypeConstraints,
): ReturnType<T>[] => {
  if (specific.kind !== TypeKind.Curried) return []
  return apply<T>(
    isInstanceOf(state, specific.from, general.from, constraints),
    ([stateWithFrom, constraintsWithFrom]) =>
      isInstanceOf(stateWithFrom, specific.to, general.to, constraintsWithFrom),
  )
}

const isInstanceOfMapType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: MapType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType<T>[] => {
  if (specific.kind === TypeKind.Map)
    return propertyIsInstanceOf(
      state,
      specific.property,
      general.property,
      constraints,
    )
  if (specific.kind === TypeKind.Object) {
    const specificProperty = buildProperty(
      buildUnionType(specific.properties.map((property) => property.key)),
      buildUnionType(specific.properties.map((property) => property.value)),
    )
    return propertyIsInstanceOf(
      state,
      specificProperty,
      general.property,
      constraints,
    )
  }
  return []
}

const isInstanceOfObjectType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ObjectType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType<T>[] => {
  if (specific.kind === TypeKind.Map)
    return forAll(
      state,
      general.properties,
      constraints,
      (state, property, constraints) =>
        propertyIsInstanceOf(state, specific.property, property, constraints),
    )
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
  constraints: TypeConstraints,
): ReturnType<T>[] =>
  apply<T>(
    isInstanceOf(state, specific.key, general.key, constraints),
    ([stateWithKey, constraintsWithKey]) =>
      isInstanceOf(
        stateWithKey,
        specific.value,
        general.value,
        constraintsWithKey,
      ),
  )
