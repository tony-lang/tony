import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { TypeConstructor } from '../types'

export class InferAbstractionType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (abstractionBranchTypes: TypeConstructor[]): TypeConstructor => {
    const abstractionType = this.inferType(abstractionBranchTypes)

    this.checkVaryingAbstractionBranchTypes(
      abstractionBranchTypes,
      abstractionType
    )
    this.checkInvalidAbstractionType(abstractionType)

    return abstractionType
  }

  private inferType = (
    abstractionBranchTypes: TypeConstructor[]
  ): TypeConstructor =>
    abstractionBranchTypes[0]

  private checkVaryingAbstractionBranchTypes = (
    abstractionBranchTypes: TypeConstructor[],
    abstractionType: TypeConstructor
  ): void => {
    const varyingAbstractionBranchType = abstractionBranchTypes
      .find(abstractionBranchType => {
        return !abstractionType.matches(abstractionBranchType) &&
               !abstractionBranchType.matches(abstractionType)
      })

    if (varyingAbstractionBranchType) this.errorHandler.throw(
      'Abstraction branches have varying types, got ' +
      `'${varyingAbstractionBranchType.toString()}', expected ` +
      `'${abstractionType.toString()}'`,
      this.node
    )
  }

  private checkInvalidAbstractionType = (
    abstractionType: TypeConstructor
  ): void => {
    if (abstractionType.isValid()) return

    this.errorHandler.throw(
      `Type '${abstractionType.toString()}' of abstraction is invalid`,
      this.node
    )
  }
}
