import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  MAP_TYPE
} from '../types'

export class InferRestMapType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode
  private typeConstraints: TypeConstraints

  constructor(
    node: Parser.SyntaxNode,
    errorHandler: ErrorHandler,
    typeConstraints: TypeConstraints
  ) {
    this.node = node
    this.errorHandler = errorHandler
    this.typeConstraints = typeConstraints
  }

  perform = (type: Type): Type => {
    try {
      return type.unify(
        new ParametricType(MAP_TYPE, [new TypeVariable, new TypeVariable]),
        this.typeConstraints
      )
    } catch (error) {
      this.errorHandler.throw(
        `Type '${type.toString()}' not assignable to map type.\n\n` +
        `${error.message}`,
        this.node
      )
    }
  }
}
