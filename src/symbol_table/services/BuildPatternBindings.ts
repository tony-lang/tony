import { BuildType, TypeVariable } from '../../types'
import { IdentifierBinding } from '../models'
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

  perform = (node: Parser.SyntaxNode): IdentifierBinding[] => {
    if (
      node.type === 'identifier_pattern' ||
      node.type === 'shorthand_pair_identifier_pattern'
    )
      return this.handleIdentifierPattern(node)

    return node.namedChildren.reduce(
      (names: IdentifierBinding[], child) => names.concat(this.perform(child)),
      [],
    )
  }

  // prettier-ignore
  private handleIdentifierPattern = (
    node: Parser.SyntaxNode,
  ): IdentifierBinding[] => {
    const name = node.namedChild(0)!.text
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const type = node.typeNode ? new BuildType().handleTypeConstructor(node.typeNode) : new TypeVariable()

    return [
      new IdentifierBinding(name, type, {
        isExported: this._isExported,
        isImplicit: this._isImplicit,
      }),
    ]
  }
}
