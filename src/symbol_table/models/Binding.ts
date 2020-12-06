import Parser from 'tree-sitter'

export interface Binding {
  filePath: string | undefined
  isExported: boolean
  isImplicit: boolean
  isImported: boolean
  name: string
  node: Parser.SyntaxNode | undefined
  transformedImportName: string | undefined
  transformedName: string
}
