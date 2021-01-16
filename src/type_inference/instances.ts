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

type ReturnType = [isInstanceOf: boolean, constraints: TypeConstraints]

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type.
 */
export const isInstanceOf = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ResolvedType,
  constraints = buildTypeConstraints(),
): ReturnType => {
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
      return [specific === general, constraints]
  }
}

const typeVariableIsInstanceOf = <T extends State>(
  state: T,
  typeVariable: TypeVariable,
  type: ResolvedType,
  constraints: TypeConstraints,
): ReturnType => [
  true,
  unifyConstraints(
    state,
    constraints,
    buildTypeConstraintsFromType(typeVariable, type),
  ),
]

const isInstanceOfCurriedType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: CurriedType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType => {
  if (specific.kind !== TypeKind.Curried) return [false, constraints]
  const [fromIsInstanceOf, constraintsWithFrom] = isInstanceOf(
    state,
    specific.from,
    general.from,
    constraints,
  )
  const [toIsInstanceOf, constraintsWithTo] = isInstanceOf(
    state,
    specific.to,
    general.to,
    constraintsWithFrom,
  )
  return [fromIsInstanceOf && toIsInstanceOf, constraintsWithTo]
}

const isInstanceOfMapType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: MapType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType => {
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
  return [false, constraints]
}

const isInstanceOfObjectType = <T extends State>(
  state: T,
  specific: ResolvedType,
  general: ObjectType<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType => {
  if (specific.kind === TypeKind.Map)
    return forAll(
      general.properties,
      constraints,
      (property, constraints) =>
        propertyIsInstanceOf(state, specific.property, property, constraints),
      (isInstanceOfs) => isInstanceOfs.every(Boolean),
    )
  if (specific.kind === TypeKind.Object) {
    return forAll(
      specific.properties,
      constraints,
      (specificProperty, constraints) =>
        forAll(
          general.properties,
          constraints,
          (generalProperty, constraints) =>
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
  return [false, constraints]
}

const propertyIsInstanceOf = <T extends State>(
  state: T,
  specific: Property<ResolvedType>,
  general: Property<ResolvedType>,
  constraints: TypeConstraints,
): ReturnType => {
  const [keyIsInstanceOf, constraintsWithKey] = isInstanceOf(
    state,
    specific.key,
    general.key,
    constraints,
  )
  const [valueIsInstanceOf, constraintsWithValue] = isInstanceOf(
    state,
    specific.value,
    general.value,
    constraintsWithKey,
  )
  return [keyIsInstanceOf && valueIsInstanceOf, constraintsWithValue]
}

const forAll = <T>(
  types: T[],
  constraints: TypeConstraints,
  combiner: (type: T, constraints: TypeConstraints) => ReturnType,
  reducer: (isInstanceOfs: boolean[]) => boolean,
): ReturnType => {
  const [isInstanceOfs, newConstraints] = types.reduce<
    [boolean[], TypeConstraints]
  >(
    ([acc, constraints], type) => {
      const [isInstanceOf, newConstraints] = combiner(type, constraints)
      return [[...acc, isInstanceOf], newConstraints]
    },
    [[], constraints],
  )

  return [reducer(isInstanceOfs), newConstraints]
}
