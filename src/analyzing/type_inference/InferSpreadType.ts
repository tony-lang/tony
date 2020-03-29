import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { ParametricType, Type, LIST_TYPE, MAP_TYPE, TUPLE_TYPE } from '../types'

export class InferSpreadType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (valueType: Type): Type => {
    if (valueType instanceof ParametricType && valueType.name === LIST_TYPE)
      return valueType.parameters[0]
    else if (valueType instanceof ParametricType &&
             valueType.name === TUPLE_TYPE)
      return valueType
    else if (valueType instanceof ParametricType &&
               valueType.name === MAP_TYPE)
      return valueType

    this.errorHandler.throw(
      'Spread operator may only be used on values of list, tuple or map ' +
      `types, got '${valueType.toString()}'`,
      this.node
    )
  }
}
