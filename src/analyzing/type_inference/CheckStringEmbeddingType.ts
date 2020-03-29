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
    try {
      stringEmbeddingType.unify(new ParametricType(STRING_TYPE))
    } catch (error) {
      this.errorHandler.throw(
        `Type '${stringEmbeddingType.toString()}' not assignable to type ` +
        `'${STRING_TYPE}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
