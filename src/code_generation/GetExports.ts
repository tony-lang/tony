import Parser from 'tree-sitter'

import { TransformIdentifier } from './TransformIdentifier'

export class GetExports {
  private transformIdentifier: TransformIdentifier

  constructor(transformIdentifier: TransformIdentifier) {
    this.transformIdentifier = transformIdentifier
  }

  perform = (node: Parser.SyntaxNode): string[] => {
    return node.namedChildren
      .map(child => this.resolveExport(child))
      .reduce((acc, value) => acc.concat(value), [])
  }

  resolveExport = (node: Parser.SyntaxNode): string[] => {
    if (node.type === 'identifier_pattern')
      return [this.transformIdentifier.perform(node.text)]
    else if (node.type === 'export')
      return this.resolveExport(node.namedChild(0))
    else if (node.type === 'assignment')
      return this.resolveExport(node.namedChild(0))
    else
      return []
  }
}
