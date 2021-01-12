import {
  ResolvedConstrainedType,
  TypeConstraints,
} from '../types/type_inference/constraints'
import { Resolved } from '../types/type_inference/categories'

/**
 * Given a specific and a general type, determines whether the specific type is
 * an instance of the general type.
 */
export const isInstanceOf = (
  specific: ResolvedConstrainedType,
  general: ResolvedConstrainedType,
): [isInstanceOf: boolean, typeConstraints: TypeConstraints<Resolved>] => {}
