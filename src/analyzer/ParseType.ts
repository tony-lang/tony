import Parser from 'tree-sitter'

import { AtomicType, Type, TypeConstructor } from '../types'

export class ParseType {
  static perform = (node: Parser.SyntaxNode): TypeConstructor =>
    new TypeConstructor(node.namedChildren.map(child => ParseType.rec(child)))

  private static performType = (node: Parser.SyntaxNode): Type =>
    new Type(node.text)

  private static rec = (node: Parser.SyntaxNode): AtomicType => {
    switch (node.type) {
    case 'type':
      return ParseType.performType(node)
    case 'type_constructor':
      return ParseType.perform(node)
    default:
      console.log(`Could not find generator for AST type node '${node.type}'.`)
      process.exit(1)
    }
  }
}
