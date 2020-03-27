import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { TypeConstructor, STRING_TYPE } from '../types'

export class CheckStringEmbeddingType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (stringEmbeddingTypes: TypeConstructor[]): void => {
    stringEmbeddingTypes.forEach(stringEmbeddingType => {
      this.checkStringEmbeddingTypeMismatch(stringEmbeddingType)
    })
  }

  private checkStringEmbeddingTypeMismatch = (
    stringEmbeddingType: TypeConstructor
  ): void => {
    if (stringEmbeddingType.matches(STRING_TYPE)) return

    this.errorHandler.throw(
      'String embedding must return value of type \'String\', instead ' +
      `returned '${stringEmbeddingType.toString()}'`,
      this.node
    )
  }
}
