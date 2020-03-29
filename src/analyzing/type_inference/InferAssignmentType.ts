import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type } from '../types'

export class InferAssignmentType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (patternType: Type, valueType: Type): Type => {
    try {
      return patternType.unify(valueType)
    } catch (error) {
      this.errorHandler.throw(
        `Type '${valueType.toString()}' not assignable to type ` +
        `'${valueType.toString()}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
