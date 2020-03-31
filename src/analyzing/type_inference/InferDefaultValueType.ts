import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type, TypeConstraints } from '../types'

export class InferDefaultValueType {
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

  perform = (type: Type, defaultValueType: Type): Type => {
    try {
      return type.unify(defaultValueType, this.typeConstraints)
    } catch (error) {
      this.errorHandler.throw(
        `Type '${defaultValueType.toString()}' is not assignable to type ` +
        `'${type.toString()}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
