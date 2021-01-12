import { ConstrainedType } from '../types/type_inference/constraints'
import { ScopeWithErrors } from '../types/analyze/scopes'
import { Type } from '../types/type_inference/types'

type State = {
  scopes: ScopeWithErrors[]
}

/**
 * Given a type, reduce the type until it is normal (i.e. cannot be reduced
 * further).
 */
export const normalize = <T extends State>(
  state: T,
  type: ConstrainedType<Type>,
): ConstrainedType<Type> => {}
