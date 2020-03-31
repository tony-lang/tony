import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeConstraints,
  STRING_TYPE
} from '../types'

export class CheckStringEmbeddingType {
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

  perform = (stringEmbeddingTypes: Type[]): void => {
    stringEmbeddingTypes.forEach(stringEmbeddingType => {
      this.checkStringEmbeddingTypeMismatch(stringEmbeddingType)
    })
  }

  private checkStringEmbeddingTypeMismatch = (
    stringEmbeddingType: Type
  ): void => {
    try {
      stringEmbeddingType.unify(
        new ParametricType(STRING_TYPE),
        this.typeConstraints
      )
    } catch (error) {
      this.errorHandler.throw(
        `Type '${stringEmbeddingType.toString()}' not assignable to type ` +
        `'${STRING_TYPE}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
