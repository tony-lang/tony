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
import { Answers, buildAnswer } from '../types/type_inference/answers'
import {
  Constraints,
  buildConstraints,
} from '../types/type_inference/constraints'
import { ResolvedType, Type } from '../types/type_inference/categories'
import { State } from '../types/type_inference/state'

type Return = { constraints: Constraints; type: ResolvedType }

/**
 * Given a type, reduce the type until it is normal (i.e. cannot be reduced
 * further).
 */
export const normalize = <T extends State>(
  state: T,
  type: Type,
): Answers<T, Return> => {
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
): Answers<T, Return> => {}

const handleConditionalType = <T extends State>(
  state: T,
  type: ConditionalType,
): Answers<T, Return> => {
  // normalize(state, type.type).map(([stateWithType, constraintsWithType, normalizedType]) => {
  //   const [] = isInstanceOfAll(stateWithType, normalizedType, type.constraints, constraintsWithType)
  // })
}

const handleCurriedType = <T extends State>(
  state: T,
  type: CurriedType,
): Answers<T, Return> => {
  // const [stateWithFrom, from] = normalize(state, type.from)
  // const [stateWithTo, to] = normalize(stateWithFrom, type.to)
  // return [stateWithTo, { ...type, from, to }]
}

const handleInterfaceType = <T extends State>(
  state: T,
  type: InterfaceType,
): Answers<T, Return> => {}

const handleIntersectionType = <T extends State>(
  state: T,
  type: IntersectionType,
): Answers<T, Return> => {}

const handleObjectType = <T extends State>(
  state: T,
  type: ObjectType,
): Answers<T, Return> => {}

const handleParametricType = <T extends State>(
  state: T,
  type: ParametricType,
): Answers<T, Return> => {}

const handleRefinedType = <T extends State>(
  state: T,
  type: RefinedType,
): Answers<T, Return> => {}

const handleSubtractionType = <T extends State>(
  state: T,
  type: SubtractionType,
): Answers<T, Return> => {}

const handleUnionType = <T extends State>(
  state: T,
  type: UnionType,
): Answers<T, Return> => {}
