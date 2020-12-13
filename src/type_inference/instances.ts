import {
  ConstrainedType,
  Type,
  TypeConstraints,
} from '../types/type_inference/types'

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type.
 */
export const isInstanceOf = (
  specific: ConstrainedType<Type>,
  general: ConstrainedType<Type>,
): [isInstanceOf: boolean, typeConstraints: TypeConstraints] => {}
