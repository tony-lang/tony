import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type, TypeConstraints } from '../types'

export class InferAbstractionType {
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

  perform = (abstractionBranchTypes: Type[]): Type => {
    try {
      return abstractionBranchTypes.reduce(
        (abstractionType, abstractionBranchType) => {
          return abstractionType
            .unify(abstractionBranchType, this.typeConstraints)
        }
      ).applyConstraints(this.typeConstraints)
    } catch (error) {
      this.errorHandler.throw(
        `Abstraction branches have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
