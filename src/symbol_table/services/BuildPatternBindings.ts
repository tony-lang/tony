import { IdentifierBindingTemplate } from '../models'
import Parser from 'tree-sitter'

export class BuildPatternBindings {
  private _isExported: boolean
  private _isImplicit: boolean

  constructor({
    isExported,
    isImplicit,
  }: {
    isExported: boolean
    isImplicit: boolean
  }) {
    this._isExported = isExported
    this._isImplicit = isImplicit
  }

  perform = (node: Parser.SyntaxNode): IdentifierBindingTemplate[] => {
    if (
      node.type === 'identifier_pattern' ||
      node.type === 'shorthand_pair_identifier_pattern'
    )
      return this.handleIdentifierPattern(node)

    return node.namedChildren.reduce(
      (names: IdentifierBindingTemplate[], child) =>
        names.concat(this.perform(child)),
      [],
    )
  }

  private handleIdentifierPattern = (
    node: Parser.SyntaxNode,
  ): IdentifierBindingTemplate[] => {
    const name = node.namedChild(0)!.text

    return [
      new IdentifierBindingTemplate(node, name, {
        isExported: this._isExported,
        isImplicit: this._isImplicit,
      }),
    ]
  }
}
