import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeVariable,
  MAP_TYPE
} from '../types'

export class InferMapType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (mapTypes: Type[]): Type => {
    try {
      return mapTypes.reduce((mapType, otherMapType) => {
        return mapType.unify(otherMapType)
      }, new ParametricType(MAP_TYPE, [new TypeVariable, new TypeVariable]))
    } catch (error) {
      this.errorHandler.throw(
        `Keys or values of map have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
