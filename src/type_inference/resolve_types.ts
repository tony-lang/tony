import {
  ResolvedType,
  Type,
  UnresolvedType,
} from '../types/type_inference/types'
import { TypeBinding, TypedTermBinding } from '../types/analyze/bindings'

/**
 * Given a stack of typed term bindings, a stack of type bindings and a type,
 * resolves that type by replacing term types and parametric types with their
 * actual type.
 */
export const resolveType = (
  typedBindings: TypedTermBinding<Type>[][],
  typeBindings: TypeBinding[][],
  type: UnresolvedType,
): ResolvedType => {}
