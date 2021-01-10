import { ResolvedConstrainedType } from '../types/type_inference/constraints'

/**
 * Given a type, reduce the type until it is normal (i.e. cannot be reduced
 * further).
 */
export const normalize = (
  type: ResolvedConstrainedType,
): ResolvedConstrainedType => {}
