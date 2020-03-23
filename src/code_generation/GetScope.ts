import Parser from 'tree-sitter'

import { TransformIdentifier } from './TransformIdentifier'

export class GetScope {
  private transformIdentifier: TransformIdentifier

  constructor(transformIdentifier: TransformIdentifier) {
    this.transformIdentifier = transformIdentifier
  }

  perform = (node: Parser.SyntaxNode): string[] => {
    // this to not immediately return when given a block
    return node.namedChildren
      .map(child => this.rec(child))
      .reduce((acc, value) => acc.concat(value), [])
  }

  rec = (node: Parser.SyntaxNode): string[] => {
    if (node.type === 'block')
      return []
    else if (node.type === 'identifier_pattern')
      return [this.transformIdentifier.perform(node.text)]
    else if (node.type === 'module')
      return [this.transformIdentifier.perform(node.namedChild(0).text)]
    else
      return node.namedChildren
        .map(child => this.rec(child))
        .reduce((acc, value) => acc.concat(value), [])
  }
}
