import { ResolvedType, Type } from '../types/type_inference/categories'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'

type State = {
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
}

type ReturnType<T extends State> = [newState: T, type: ResolvedType]

/**
 * Given a type, reduce the type until it is normal (i.e. cannot be reduced
 * further).
 */
export const normalize = <T extends State>(
  state: T,
  type: Type,
): ReturnType<T> => {}
