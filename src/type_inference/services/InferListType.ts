import {
  LIST_TYPE,
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
} from '../../types'
import { InferTypes } from '../InferTypes'
import Parser from 'tree-sitter'

export class InferListType {
  private _inferTypes: InferTypes
  private _typeConstraints: TypeConstraints

  constructor(inferTypes: InferTypes, typeConstraints: TypeConstraints) {
    this._inferTypes = inferTypes
    this._typeConstraints = typeConstraints
  }

  perform = (valueNodes: Parser.SyntaxNode[]): ParametricType => {
    const valueType = valueNodes.reduce((valueType: Type, valueNode) => {
      const otherValueType = this._inferTypes.traverse(valueNode)!

      if (valueNode.type === 'spread_list') {
        const restType = new ParametricType(LIST_TYPE).unify(
          otherValueType,
          this._typeConstraints,
          true,
        )

        return valueType.unify(restType.parameters[0], this._typeConstraints)
      }

      return valueType.unify(otherValueType, this._typeConstraints)
    }, new TypeVariable())

    return new ParametricType(LIST_TYPE, [valueType])
  }
}
