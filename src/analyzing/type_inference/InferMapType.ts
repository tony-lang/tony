import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  MAP_TYPE
} from '../types'

export class InferMapType {
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

  perform = (mapTypes: Type[]): Type => {
    try {
      return mapTypes.reduce((mapType, otherMapType) => {
        return mapType.unify(otherMapType, this.typeConstraints)
      }, new ParametricType(MAP_TYPE, [new TypeVariable, new TypeVariable]))
    } catch (error) {
      this.errorHandler.throw(
        `Keys or values of map have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
