import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { ParametricType, Type, TUPLE_TYPE } from '../types'

export class InferRestTupleType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (type: Type): Type => {
    if (type instanceof ParametricType && type.name === TUPLE_TYPE) return type

    this.errorHandler.throw(
      'Rest operator within tuple pattern may only be used on tuple types' +
      `, got '${type.toString()}'`,
      this.node
    )
  }
}
