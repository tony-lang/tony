import Parser from 'tree-sitter'
import {
  ImportBinding,
  ImportIdentifierBinding,
  ImportTypeBinding,
} from '../models'
import { isNotUndefined } from '../../utilities'
import { InternalError, DuplicateBindingError, assert } from '../../errors'
import { BuildType, TypeVariable, ParametricType } from '../../types'

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
      case 'type_name':
        return this.handleTypeName(node)
      default:
        throw new InternalError(
          `ResolveImportBindings: Could not find generator for AST node '${node.type}'.`,
        )
    }
  }

  private handleIdentifierPattern = (
    node: Parser.SyntaxNode,
  ): ImportIdentifierBinding => {
    const name = node.namedChild(0)!.text
    const type =
      node.namedChildCount == 2
        ? new BuildType().handleTypeConstructor(node.namedChild(1)!)
        : new TypeVariable()

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
    const originalType = this.handleTypeName(node.namedChild(0)!)
    const binding = this.handleTypeName(node.namedChild(1)!)

    binding.originalType = originalType.type

    return binding
  }

  private handleTypeName = (node: Parser.SyntaxNode): ImportTypeBinding => {
    const type = new BuildType().handleTypeName(node)

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
