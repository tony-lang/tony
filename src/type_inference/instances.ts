import {
  CurriedType,
  MapType,
  ObjectType,
  Property,
  TypeKind,
  TypeVariable,
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

type ReturnType<T extends State> = [
  newState: T,
  isInstanceOf: boolean,
  constraints: TypeConstraints,
]

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type.
 */
export const isInstanceOf = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ResolvedType,
  constraints = buildTypeConstraints(),
): ReturnType<T> => {
  if (specific.kind === TypeKind.Variable)
    return typeVariableIsInstanceOf(state, specific, general, constraints)

  switch (general.kind) {
    case TypeKind.Curried:
      return isInstanceOfCurriedType(state, specific, general, constraints)
    case TypeKind.Interface:
      throw new NotImplementedError(
        'Cannot deduce assignability to interface types yet.',
      )
    case TypeKind.Intersection:
      throw new NotImplementedError(
        'Cannot deduce assignability to intersection types yet.',
      )
    case TypeKind.Map:
      return isInstanceOfMapType(state, specific, general, constraints)
    case TypeKind.Object:
      return isInstanceOfObjectType(state, specific, general, constraints)
    case TypeKind.Refined:
    case TypeKind.RefinedTerm:
      throw new NotImplementedError(
        'Cannot deduce assignability to refined types yet.',
      )
    case TypeKind.Union:
      throw new NotImplementedError(
        'Cannot deduce assignability to union types yet.',
      )
    case TypeKind.Variable:
      return typeVariableIsInstanceOf(state, general, specific, constraints)

    case TypeKind.Boolean:
    case TypeKind.Number:
    case TypeKind.RegExp:
    case TypeKind.String:
    case TypeKind.TemporaryVariable:
    case TypeKind.Void:
      return [state, specific === general, constraints]
  }
}

const typeVariableIsInstanceOf = <T extends State>(
  state: T,
  typeVariable: TypeVariable,
  type: ResolvedType,
  constraints: TypeConstraints,
): ReturnType<T> => {
  const [newState, newConstraints] = unifyConstraints(
    state,
    constraints,
    buildTypeConstraintsFromType(typeVariable, type),
  )
  return [newState, true, newConstraints]
}

const isInstanceOfCurriedType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: CurriedType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType<T> => {
  if (specific.kind !== TypeKind.Curried) return [state, false, constraints]
  const [stateWithFrom, fromIsInstanceOf, constraintsWithFrom] = isInstanceOf(
    state,
    specific.from,
    general.from,
    constraints,
  )
  const [stateWithTo, toIsInstanceOf, constraintsWithTo] = isInstanceOf(
    stateWithFrom,
    specific.to,
    general.to,
    constraintsWithFrom,
  )
  return [stateWithTo, fromIsInstanceOf && toIsInstanceOf, constraintsWithTo]
}

const isInstanceOfMapType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: MapType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType<T> => {
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
  return [state, false, constraints]
}

const isInstanceOfObjectType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ObjectType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType<T> => {
  if (specific.kind === TypeKind.Map)
    return forAll(
      state,
      general.properties,
      constraints,
      (state, property, constraints) =>
        propertyIsInstanceOf(state, specific.property, property, constraints),
      (isInstanceOfs) => isInstanceOfs.every(Boolean),
    )
  if (specific.kind === TypeKind.Object) {
    return forAll(
      state,
      specific.properties,
      constraints,
      (state, specificProperty, constraints) =>
        forAll(
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
          (isInstanceOfs) => isInstanceOfs.some(Boolean),
        ),
      (isInstanceOfs) => isInstanceOfs.every(Boolean),
    )
  }
  return [state, false, constraints]
}

const propertyIsInstanceOf = <T extends State>(
  state: T,
  specific: Property<ResolvedType>,
  general: Property<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType<T> => {
  const [stateWithKey, keyIsInstanceOf, constraintsWithKey] = isInstanceOf(
    state,
    specific.key,
    general.key,
    constraints,
  )
  const [
    stateWithValue,
    valueIsInstanceOf,
    constraintsWithValue,
  ] = isInstanceOf(
    stateWithKey,
    specific.value,
    general.value,
    constraintsWithKey,
  )
  return [
    stateWithValue,
    keyIsInstanceOf && valueIsInstanceOf,
    constraintsWithValue,
  ]
}

const forAll = <T extends State, U>(
  state: T,
  types: U[],
  constraints: TypeConstraints,
  combiner: (state: T, type: U, constraints: TypeConstraints) => ReturnType<T>,
  reducer: (isInstanceOfs: boolean[]) => boolean,
): ReturnType<T> => {
  const [newState, isInstanceOfs, newConstraints] = types.reduce<
    [T, boolean[], TypeConstraints]
  >(
    ([state, acc, constraints], type) => {
      const [newState, isInstanceOf, newConstraints] = combiner(
        state,
        type,
        constraints,
      )
      return [newState, [...acc, isInstanceOf], newConstraints]
    },
    [state, [], constraints],
  )

  return [newState, reducer(isInstanceOfs), newConstraints]
}
