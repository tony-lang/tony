import { TypeError } from '../../errors'

import { ParametricType, Type, LIST_TYPE, MAP_TYPE } from '../types'

export class InferSpreadType {
  perform = (valueType: Type): Type => {
    if (valueType instanceof ParametricType && valueType.name === LIST_TYPE)
      return valueType.parameters[0]
    else if (valueType instanceof ParametricType &&
             valueType.name === MAP_TYPE)
      return valueType

    throw new TypeError(
      null,
      valueType,
      'The spread operator may only be used on values of a list or map type.'
    )
  }
}
