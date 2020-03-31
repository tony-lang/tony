import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Type, TypeConstraints } from '../types'

export class InferBranchType {
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

  perform = (branchTypes: Type[]): Type => {
    try {
      return branchTypes.reduce(
        (type, branchType) => {
          return type.unify(branchType, this.typeConstraints)
        }
      ).applyConstraints(this.typeConstraints)
    } catch (error) {
      this.errorHandler.throw(
        `Branches have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
