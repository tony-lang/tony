import { ResolvedType, Type } from '../types/type_inference/categories'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'
import {
  AccessType,
  ConditionalType,
  CurriedType,
  InterfaceType,
  IntersectionType,
  ObjectType,
  ParametricType,
  RefinedType,
  SubtractionType,
  TypeKind,
  UnionType,
} from '../types/type_inference/types'
import {
  Constraints,
  buildConstraints,
} from '../types/type_inference/constraints'
import { isInstanceOfAll } from './instances'
import { Answers, buildAnswer } from '../types/type_inference/answers'

type State = {
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
}

type Return<T extends State> = Answers<
  T,
  { constraints: Constraints; type: ResolvedType }
>

// const apply = <T extends State>(
//   results: ReturnType<T>[],
//   callback: (result: ReturnType<T>) => ReturnType<T>[],
// ): ReturnType<T>[] => results.map((result) => callback(result)).flat()

// const forAll = <T extends State, U>(
//   state: T,
//   types: U[],
//   constraints: Constraints,
//   callback: (
//     state: T,
//     type: U,
//     constraints: Constraints,
//   ) => ReturnType<T>[],
// ): ReturnType<T>[] => {
//   if (types.length === 1) return callback(state, types[0], constraints)
//   const [type, ...remainingTypes] = types
//   const results = callback(state, type, constraints)
//   return apply(results, ([newState, newConstraints]) =>
//     forAll(newState, remainingTypes, newConstraints, callback),
//   )
// }

/**
 * Given a type, reduce the type until it is normal (i.e. cannot be reduced
 * further).
 */
export const normalize = <T extends State>(state: T, type: Type): Return<T> => {
  switch (type.kind) {
    case TypeKind.Access:
      return handleAccessType(state, type)
    case TypeKind.Conditional:
      return handleConditionalType(state, type)
    case TypeKind.Curried:
      return handleCurriedType(state, type)
    case TypeKind.Interface:
      return handleInterfaceType(state, type)
    case TypeKind.Intersection:
      return handleIntersectionType(state, type)
    case TypeKind.Object:
      return handleObjectType(state, type)
    case TypeKind.Parametric:
      return handleParametricType(state, type)
    case TypeKind.Refined:
      return handleRefinedType(state, type)
    case TypeKind.Subtraction:
      return handleSubtractionType(state, type)
    case TypeKind.Union:
      return handleUnionType(state, type)
    default:
      return [buildAnswer(state, { type, constraints: buildConstraints() })]
  }
}

// const normalizeAll = <T extends State, U extends Type>(
//   state: T,
//   types: U[],
// ) => types.reduce<[newState: T, constraints: Constraints, types: ResolvedType[]][]>((acc, type) => {
//   const [newState, newConstraints, normalizedType] = normalize(state, type)
//   return
// }, [[state, buildConstraints(), []]])

const handleAccessType = <T extends State>(
  state: T,
  type: AccessType,
): Return<T> => {}

const handleConditionalType = <T extends State>(
  state: T,
  type: ConditionalType,
): Return<T> => {
  // normalize(state, type.type).map(([stateWithType, constraintsWithType, normalizedType]) => {
  //   const [] = isInstanceOfAll(stateWithType, normalizedType, type.constraints, constraintsWithType)
  // })
}

const handleCurriedType = <T extends State>(
  state: T,
  type: CurriedType,
): Return<T>[] => {
  // const [stateWithFrom, from] = normalize(state, type.from)
  // const [stateWithTo, to] = normalize(stateWithFrom, type.to)
  // return [stateWithTo, { ...type, from, to }]
}

const handleInterfaceType = <T extends State>(
  state: T,
  type: InterfaceType,
): Return<T>[] => {}

const handleIntersectionType = <T extends State>(
  state: T,
  type: IntersectionType,
): Return<T>[] => {}

const handleObjectType = <T extends State>(
  state: T,
  type: ObjectType,
): Return<T>[] => {}

const handleParametricType = <T extends State>(
  state: T,
  type: ParametricType,
): Return<T>[] => {}

const handleRefinedType = <T extends State>(
  state: T,
  type: RefinedType,
): Return<T>[] => {}

const handleSubtractionType = <T extends State>(
  state: T,
  type: SubtractionType,
): Return<T>[] => {}

const handleUnionType = <T extends State>(
  state: T,
  type: UnionType,
): Return<T>[] => {}
