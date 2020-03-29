import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { ParametricType, Type, LIST_TYPE } from '../types'

export class InferRestListType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (type: Type): Type => {
    if (type instanceof ParametricType &&
        type.name === LIST_TYPE) return type.parameters[0]

    this.errorHandler.throw(
      'Rest operator within list pattern may only be used on list types, got ' +
      `'${type.toString()}'`,
      this.node
    )
  }
}
