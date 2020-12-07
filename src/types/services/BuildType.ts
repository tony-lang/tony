import { FUNCTION_TYPE, LIST_TYPE, MAP_TYPE, TUPLE_TYPE } from '..'
import { InternalError } from '../../errors'
import { ParametricType } from '../models'
import Parser from 'tree-sitter'

export class BuildType {
  perform = (node: Parser.SyntaxNode): ParametricType => {
    switch (node.type) {
      case 'list_type':
        return this.handleListType(node)
      case 'map_type':
        return this.handleMapType(node)
      case 'tuple_type':
        return this.handleTupleType(node)
      case 'type_constructor':
        return this.handleTypeConstructor(node)
      case 'type':
        return this.handleType(node)
      default:
        throw new InternalError(
          `Could not find generator for AST node '${node.type}'.`,
        )
    }
  }

  private handleListType = (node: Parser.SyntaxNode): ParametricType => {
    const valueType = this.perform(node.namedChild(0)!)

    return new ParametricType(LIST_TYPE, [valueType])
  }

  private handleMapType = (node: Parser.SyntaxNode): ParametricType => {
    const keyType = this.perform(node.namedChild(0)!)
    const valueType = this.perform(node.namedChild(1)!)

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private handleTupleType = (node: Parser.SyntaxNode): ParametricType => {
    const valueTypes = node.namedChildren.map((child) => this.perform(child))

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }

  private handleTypeConstructor = (node: Parser.SyntaxNode): ParametricType => {
    if (node.namedChildCount == 1) {
      const type = this.perform(node.namedChild(0)!)

      return type
    }

    const types = node.namedChildren.map((childNode) => this.perform(childNode))
    return new ParametricType(FUNCTION_TYPE, types)
  }

  private handleType = (node: Parser.SyntaxNode): ParametricType => {
    const name = node.text

    return new ParametricType(name)
  }
}
