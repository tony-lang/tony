import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { TypeConstructor } from '../types'

export class CheckDefaultValueType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (
    type: TypeConstructor,
    defaultValueType: TypeConstructor
  ): void => {
    if (defaultValueType.matches(type)) {
      type.isOptional = true
      return
    }

    this.errorHandler.throw(
      `Type of default value '${defaultValueType.toString()}' does not ` +
      `match expected type '${type.toString()}'`,
      this.node
    )
  }
}
