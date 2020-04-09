import { BuildType, TypeVariable } from '../../types'
import { DuplicateBindingError, InternalError } from '../../errors'
import {
  ImportBinding,
  ImportIdentifierBinding,
  ImportTypeBinding,
} from '../models'
import Parser from 'tree-sitter'
import { isNotUndefined } from '../../utilities'

export class BuildImportBindings {
  private _filePath: string

  constructor(filePath: string) {
    this._filePath = filePath
  }

  perform = (node: Parser.SyntaxNode): ImportBinding[] => {
    const importClauseNode = node.namedChild(0)!
    const bindings = importClauseNode.namedChildren.reduce(
      (bindings: ImportBinding[], child) =>
        [...bindings, this.handleImportClauseEntry(child)].filter(
          isNotUndefined,
        ),
      [],
    )

    this.checkDuplicateIdentifiers(bindings)

    return bindings
  }

  private handleImportClauseEntry = (
    node: Parser.SyntaxNode,
  ): ImportBinding | undefined => {
    switch (node.type) {
      case 'identifier_pattern':
        return this.handleIdentifierPattern(node)
      case 'import_clause_identifier_pair':
        return this.handleImportClauseIdentifierPair(node)
      case 'import_clause_type_pair':
        return this.handleImportClauseTypePair(node)
      case 'type':
        return this.handleType(node)
      default:
        throw new InternalError(
          `ResolveImportBindings: Could not find generator for AST node '${node.type}'.`,
        )
    }
  }

  // prettier-ignore
  private handleIdentifierPattern = (
    node: Parser.SyntaxNode,
  ): ImportIdentifierBinding => {
    const name = node.namedChild(0)!.text
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const type = node.typeNode ? new BuildType().handleTypeConstructor(node.typeNode) : new TypeVariable

    return new ImportIdentifierBinding(this._filePath, name, name, type)
  }

  private handleImportClauseIdentifierPair = (
    node: Parser.SyntaxNode,
  ): ImportIdentifierBinding => {
    const originalName = node.namedChild(0)!.text
    const binding = this.handleIdentifierPattern(node.namedChild(1)!)

    binding.originalName = originalName

    return binding
  }

  private handleImportClauseTypePair = (
    node: Parser.SyntaxNode,
  ): ImportTypeBinding => {
    const originalType = this.handleType(node.namedChild(0)!)
    const binding = this.handleType(node.namedChild(1)!)

    binding.originalType = originalType.type

    return binding
  }

  private handleType = (node: Parser.SyntaxNode): ImportTypeBinding => {
    const type = new BuildType().handleType(node)

    return new ImportTypeBinding(this._filePath, type, type)
  }

  private checkDuplicateIdentifiers = (bindings: ImportBinding[]): void => {
    const identifiers = bindings.map((binding) => binding.name)
    const duplicateIdentifier = identifiers.find((identifier, i) =>
      identifiers.slice(i, i).includes(identifier),
    )
    if (!duplicateIdentifier) return

    throw new DuplicateBindingError(duplicateIdentifier)
  }
}
