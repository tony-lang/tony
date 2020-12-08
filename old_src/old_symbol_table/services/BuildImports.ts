import { IdentifierImport, Import, ModuleImport } from '../models'
import {
  InternalError,
  MissingExternalImportTypeHintError,
  assert,
} from '../../errors'
import { BuildType } from '../../types'
import { SyntaxNode } from 'tree-sitter-tony'

export class BuildImports {
  private _filePath: string

  constructor(filePath: string) {
    this._filePath = filePath
  }

  perform = (node: SyntaxNode): Import[] => {
    assert(node.type === 'import', 'Should be import node.')

    const importClauseNode = node.namedChild(0)!
    return importClauseNode.namedChildren.reduce(
      (bindings: Import[], child) => [
        ...bindings,
        this.handleImportClauseEntry(child),
      ],
      [],
    )
  }

  private handleImportClauseEntry = (node: SyntaxNode): Import => {
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
          `Could not find generator for AST node '${node.type}'.`,
        )
    }
  }

  private handleIdentifierPattern = (node: SyntaxNode): IdentifierImport => {
    const name = node.namedChild(0)!.text
    // @ts-ignore
    const typeNode: Parser.SyntaxNode | undefined = node.typeNode
    if (typeNode === undefined)
      throw new MissingExternalImportTypeHintError(name)

    const type = new BuildType().perform(typeNode)
    return new IdentifierImport(node, this._filePath, type, name)
  }

  private handleImportClauseIdentifierPair = (
    node: SyntaxNode,
  ): IdentifierImport => {
    const name = node.namedChild(0)!.text
    const alias = this.handleIdentifierPattern(node.namedChild(1)!)

    return new IdentifierImport(
      node,
      this._filePath,
      alias.type,
      name,
      alias.name,
    )
  }

  private handleImportClauseTypePair = (node: SyntaxNode): ModuleImport => {
    const name = new BuildType().perform(node.namedChild(0)!)
    const alias = new BuildType().perform(node.namedChild(1)!)

    return new ModuleImport(node, this._filePath, name, alias)
  }

  private handleType = (node: SyntaxNode): ModuleImport => {
    const name = new BuildType().perform(node)

    return new ModuleImport(node, this._filePath, name)
  }
}
