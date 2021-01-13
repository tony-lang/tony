import { ResolvedType, Type } from '../types/type_inference/categories'
import { TypeAssignment, TypeBinding } from '../types/analyze/bindings'
import { ScopeWithTypes } from '../types/analyze/scopes'

type State = {
  scopes: ScopeWithTypes[]
}

/**
 * Given a stack of typed term bindings, a stack of type bindings and a type,
 * resolves that type by replacing term types and parametric types with their
 * actual type.
 */
export const resolveType = <T extends State>(
  state: T,
  typedTerms: TypeAssignment[][],
  types: TypeBinding[][],
  type: Type,
): ResolvedType => {}
