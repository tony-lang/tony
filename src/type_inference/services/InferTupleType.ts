import { ParametricType, TUPLE_TYPE, Type } from '../../types'
import { TypeError } from '../../errors'

export class InferTupleType {
  perform = (valueTypes: Type[]): ParametricType => {
    const parameters = valueTypes.reduce((parameters: Type[], parameter) => {
      if (parameter instanceof ParametricType && parameter.isSpread)
        if (parameter.name === TUPLE_TYPE)
          return [...parameters, ...parameter.parameters]
        else
          throw new TypeError(
            parameter,
            undefined,
            'Spread operator within tuple may only be used on a value of a tuple type.',
          )

      return [...parameters, parameter]
    }, [])

    return new ParametricType(TUPLE_TYPE, parameters)
  }
}
