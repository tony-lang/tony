import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type, TypeConstraints } from '../types'

export class InferIfType {
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

  perform = (blockTypes: Type[]): Type => {
    try {
      return blockTypes.reduce(
        (type, blockType) => {
          return type.unify(blockType, this.typeConstraints)
        }
      ).applyConstraints(this.typeConstraints)
    } catch (error) {
      this.errorHandler.throw(
        `Blocks of conditional have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
