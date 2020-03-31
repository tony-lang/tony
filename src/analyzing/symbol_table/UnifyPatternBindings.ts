import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { Binding } from './Binding'

export class UnifyPatternBindings {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (bindings: Binding[][]): Binding[] => {
    return bindings.reduce((acc, bindings) => {
      this.checkBindingMissing(acc, bindings)

      return acc.concat(bindings)
    })
  }

  checkBindingMissing = (a: Binding[], b: Binding[]): void => {
    const missingBinding = a.find(binding => !b.includes(binding)) ||
                           b.find(binding => !a.includes(binding))
    if (!missingBinding) return

    this.errorHandler.throw(
      `The binding '${missingBinding.name}' is missing from one of the ` +
      'patterns.',
      this.node
    )
  }
}
