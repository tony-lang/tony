import {
  AccessType,
  ClassType,
  ConditionalType,
  CurriedType,
  IntersectionType,
  Keyof,
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
    case TypeKind.Class:
      return handleClassType(state, type)
    case TypeKind.Conditional:
      return handleConditionalType(state, type)
    case TypeKind.Curried:
      return handleCurriedType(state, type)
    case TypeKind.Intersection:
      return handleIntersectionType(state, type)
    case TypeKind.Keyof:
      return handleKeyof(state, type)
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
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: AccessType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize access types yet.')
}

const handleClassType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: ClassType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize interface types yet.')
}

const handleConditionalType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: ConditionalType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize conditional types yet.')
}

const handleCurriedType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: CurriedType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize curried types yet.')
}

const handleIntersectionType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: IntersectionType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize intersection types yet.')
}

const handleKeyof = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: Keyof, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize keyofs yet.')
}

const handleObjectType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: ObjectType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize object types yet.')
}

const handleParametricType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: ParametricType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize parametric types yet.')
}

const handleRefinedType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: RefinedType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize refined types yet.')
}

const handleSubtractionType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: SubtractionType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize subtraction types yet.')
}

const handleUnionType = <T extends AbstractState>(
  state: T, // eslint-disable-line @typescript-eslint/no-unused-vars
  type: UnionType, // eslint-disable-line @typescript-eslint/no-unused-vars
): Answers<T, Return> => {
  throw new NotImplementedError('Cannot normalize union types yet.')
}
