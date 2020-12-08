import { SyntaxNode } from 'tree-sitter-tony'

export interface Binding {
  filePath: string | undefined
  isExported: boolean
  isImplicit: boolean
  isImported: boolean
  name: string
  node: SyntaxNode | undefined
  transformedImportName: string | undefined
  transformedName: string
}
