import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type, ParametricType, MAP_TYPE } from '../types'

export class InferRestMapType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (type: Type): Type => {
    if (type instanceof ParametricType && type.name === MAP_TYPE) return type

    this.errorHandler.throw(
      'Rest operator within map pattern may only be used on map types, got ' +
      `'${type.toString()}'`,
      this.node
    )
  }
}
