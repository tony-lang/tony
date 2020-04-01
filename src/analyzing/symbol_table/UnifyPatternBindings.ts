import Parser from 'tree-sitter'

import { MissingBindingError } from '../../errors'

import { Binding } from './Binding'

export class UnifyPatternBindings {
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode) {
    this.node = node
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

    throw new MissingBindingError(missingBinding.name)
  }
}
