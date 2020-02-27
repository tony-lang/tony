import Parser from 'tree-sitter'

export default class GenerateCode {
  generate = (node: Parser.SyntaxNode): string => {
    switch (node.type) {
    case 'number':
      return this.generateNumber(node)
    case 'prefix_application':
      return this.generatePrefixApplication(node)
    case 'program':
      return this.generateProgram(node)
    default:
      console.log(`Could not find generator for AST node '${node.type}'.`)
      process.exit(1)
    }
  }

  generateNumber = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generatePrefixApplication = (node: Parser.SyntaxNode): string => {
    // @ts-ignore
    const func = node.leftNode.text
    // @ts-ignore
    return `${func === 'print' ? 'console.log' : func}` +
      // @ts-ignore
      `(${this.generate(node.rightNode)})`
  }

  generateProgram = (node: Parser.SyntaxNode): string => {
    return node.children
      .filter(child => child.type !== 'hash_bang_line')
      .map(expression => this.generate(expression))
      .join('\n')
  }
}
