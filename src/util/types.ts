import {
  ConstrainedType,
  Type,
  TypeConstraints,
  TypeVariable,
  buildConstrainedType,
  buildTypeVariable,
} from '../types/type_inference/types'
import { unifyConstraints } from '../type_inference/constraints'

export const buildUnconstrainedUnknownType = (): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildTypeVariable())

export const buildConstrainedUnknownType = (
  constraints: TypeConstraints,
): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildTypeVariable(), constraints)

export const buildConstrainedUnknownTypeFromTypes = (
  types: Type[],
): ConstrainedType<TypeVariable> => {
  const typeVariable = buildTypeVariable()
  return buildConstrainedType(
    typeVariable,
    types.map((type) => ({ typeVariable, type })),
  )
}

export const reduceConstraints = <T extends Type>(
  ...constrainedTypes: ConstrainedType<T>[]
): [types: T[], constraints: TypeConstraints] => [
  constrainedTypes.map((constrainedType) => constrainedType.type),
  unifyConstraints(
    ...constrainedTypes.map((constrainedType) => constrainedType.constraints),
  ),
]
