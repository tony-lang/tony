import Parser from 'tree-sitter'

export interface Import {
  alias: string
  filePath: string
  name: string
  node: Parser.SyntaxNode
}
