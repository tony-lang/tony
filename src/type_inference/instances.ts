import {
  ConstrainedType,
  TypeConstraints,
} from '../types/type_inference/constraints'
import { ResolvedType } from '../types/type_inference/categories'

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type.
 */
export const isInstanceOf = (
  specific: ConstrainedType<ResolvedType>,
  general: ConstrainedType<ResolvedType>,
): [isInstanceOf: boolean, typeConstraints: TypeConstraints] => {}
