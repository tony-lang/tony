import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  STRING_TYPE
} from '../types'

export class CheckStringEmbeddingType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (stringEmbeddingTypes: Type[]): void => {
    stringEmbeddingTypes.forEach(stringEmbeddingType => {
      this.checkStringEmbeddingTypeMismatch(stringEmbeddingType)
    })
  }

  private checkStringEmbeddingTypeMismatch = (
    stringEmbeddingType: Type
  ): void => {
    if (stringEmbeddingType instanceof ParametricType &&
        stringEmbeddingType.name === STRING_TYPE) return

    this.errorHandler.throw(
      `String embedding must return value of type '${STRING_TYPE}', ` +
      `instead returned '${stringEmbeddingType.toString()}'`,
      this.node
    )
  }
}
