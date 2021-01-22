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
import { AbstractState } from '../types/state'
import { NotImplementedError } from '../types/errors/internal'

type Return = { constraints: Constraints; type: ResolvedType }

/**
 * Given a type, reduce the type until it is normal (i.e. cannot be reduced
 * further).
 */
export const normalize = <T extends AbstractState>(
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

const handleAccessType = <T extends AbstractState>(
  state: T,
  type: AccessType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize access types yet.')
}

const handleConditionalType = <T extends AbstractState>(
  state: T,
  type: ConditionalType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize conditional types yet.')
}

const handleCurriedType = <T extends AbstractState>(
  state: T,
  type: CurriedType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize curried types yet.')
}

const handleInterfaceType = <T extends AbstractState>(
  state: T,
  type: InterfaceType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize interface types yet.')
}

const handleIntersectionType = <T extends AbstractState>(
  state: T,
  type: IntersectionType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize intersection types yet.')
}

const handleObjectType = <T extends AbstractState>(
  state: T,
  type: ObjectType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize object types yet.')
}

const handleParametricType = <T extends AbstractState>(
  state: T,
  type: ParametricType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize parametric types yet.')
}

const handleRefinedType = <T extends AbstractState>(
  state: T,
  type: RefinedType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize refined types yet.')
}

const handleSubtractionType = <T extends AbstractState>(
  state: T,
  type: SubtractionType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize subtraction types yet.')
}

const handleUnionType = <T extends AbstractState>(
  state: T,
  type: UnionType,
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize union types yet.')
}
