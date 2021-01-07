import {
  ResolvedType,
  Type,
  UnresolvedType,
} from '../types/type_inference/types'
import { TypeAssignment, TypeBinding } from '../types/analyze/bindings'

/**
 * Given a stack of typed term bindings, a stack of type bindings and a type,
 * resolves that type by replacing term types and parametric types with their
 * actual type.
 */
export const resolveType = (
  typedTerms: TypeAssignment<Type>[][],
  types: TypeBinding[][],
  type: UnresolvedType,
): ResolvedType => {}
