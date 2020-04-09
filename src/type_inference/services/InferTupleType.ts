import { ParametricType, TUPLE_TYPE, Type, TypeConstraints } from '../../types'
import { InferTypes } from '../InferTypes'
import Parser from 'tree-sitter'

export class InferTupleType {
  private _inferTypes: InferTypes
  private _typeConstraints: TypeConstraints

  constructor(inferTypes: InferTypes, typeConstraints: TypeConstraints) {
    this._inferTypes = inferTypes
    this._typeConstraints = typeConstraints
  }

  perform = (valueNodes: Parser.SyntaxNode[]): ParametricType => {
    const valueTypes = valueNodes.reduce((valueTypes: Type[], valueNode) => {
      const valueType = this._inferTypes.traverse(valueNode)!

      if (valueNode.type === 'spread_tuple') {
        const restType = new ParametricType(TUPLE_TYPE).unify(
          valueType,
          this._typeConstraints,
          true,
        )

        return [...valueTypes, ...restType.parameters]
      }

      return [...valueTypes, valueType]
    }, [])

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }
}
