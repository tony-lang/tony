import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type } from '../types'

export class InferDefaultValueType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (type: Type, defaultValueType: Type): Type => {
    try {
      const unifiedType = type.unify(defaultValueType)
      unifiedType.isOptional = true

      return unifiedType
    } catch (error) {
      this.errorHandler.throw(
        `Type '${defaultValueType.toString()}' is not assignable to type ` +
        `'${type.toString()}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
