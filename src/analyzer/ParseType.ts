import Parser from 'tree-sitter'

import {
  AtomicType,
  ListType,
  RestListType,
  TupleType,
  Type,
  TypeConstructor
} from '../types'

export class ParseType {
  static perform = (node: Parser.SyntaxNode): TypeConstructor => {
    const types = node.namedChildren.map(child => ParseType.rec(child))

    if (types.length == 1) return types[0]
    else return new TypeConstructor(types)
  }

  private static performListType = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const valueType = ParseType.rec(node.namedChild(0))

    return new TypeConstructor([new ListType(valueType)])
  }

  private static performRestListType = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const listType = ParseType.rec(node.namedChild(0)).types[0]
    if (!(listType instanceof ListType)) {
      console.log(`Rest list types may only be used on lists.`)
      process.exit(1)
    }

    return new TypeConstructor([new RestListType(listType)])
  }

  private static performTupleType = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => ParseType.rec(child))

    return new TypeConstructor([new TupleType(valueTypes)])
  }

  private static performType = (node: Parser.SyntaxNode): TypeConstructor =>
    new TypeConstructor([new Type(node.text)])

  private static rec = (node: Parser.SyntaxNode): TypeConstructor => {
    switch (node.type) {
    case 'list_type':
      return ParseType.performListType(node)
    case 'rest_list_type':
      return ParseType.performRestListType(node)
    case 'tuple_type':
      return ParseType.performTupleType(node)
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
