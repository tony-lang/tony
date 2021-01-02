import {
  ResolvedConstrainedType,
  ResolvedType,
  TypeConstraints,
} from '../types/type_inference/types'

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type.
 */
export const isInstanceOf = (
  specific: ResolvedConstrainedType,
  general: ResolvedConstrainedType,
): [isInstanceOf: boolean, typeConstraints: TypeConstraints<ResolvedType>] => {}

/**
 * Given a specific and a general type, determines whether the specific type may
 * be an instance of the general type.
 */
export const mayBeInstanceOf = (
  specific: ResolvedConstrainedType,
  general: ResolvedConstrainedType,
): [isInstanceOf: boolean, typeConstraints: TypeConstraints<ResolvedType>] => {}
