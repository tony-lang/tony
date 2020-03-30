import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  LIST_TYPE
} from '../types'

export class InferListType {
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

  perform = (valueTypes: Type[]): Type => {
    try {
      return valueTypes.reduce((valueType, otherValueType) => {
        return valueType.unify(
          new ParametricType(LIST_TYPE, [otherValueType]),
          this.typeConstraints
        )
      }, new ParametricType(LIST_TYPE, [new TypeVariable]))
    } catch (error) {
      this.errorHandler.throw(
        `Values of list have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
