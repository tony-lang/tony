import { SyntaxNode } from 'tree-sitter-tony'

export interface Import {
  alias: string
  filePath: string
  name: string
  node: SyntaxNode
}
