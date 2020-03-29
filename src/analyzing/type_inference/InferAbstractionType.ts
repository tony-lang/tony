import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type } from '../types'

export class InferAbstractionType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (abstractionBranchTypes: Type[]): Type => {
    try {
      return abstractionBranchTypes.reduce(
        (abstractionType, abstractionBranchType) => {
          return abstractionType.unify(abstractionBranchType)
        }
      )
    } catch (error) {
      this.errorHandler.throw(
        `Abstraction branches have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
