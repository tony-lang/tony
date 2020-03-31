import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type, TypeConstraints } from '../types'

export class InferAssignmentType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode
  private typeConstraints: TypeConstraints

  constructor(
    node: Parser.SyntaxNode,
    errorHandler: ErrorHandler,
    typeConstraints: TypeConstraints
  ) {
    this.node = node
    this.errorHandler = errorHandler
    this.typeConstraints = typeConstraints
  }

  perform = (patternType: Type, valueType: Type): Type => {
    try {
      return patternType.unify(valueType, this.typeConstraints)
    } catch (error) {
      this.errorHandler.throw(
        `Type '${valueType.toString()}' not assignable to type ` +
        `'${valueType.toString()}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
