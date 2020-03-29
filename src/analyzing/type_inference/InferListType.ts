import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeVariable,
  LIST_TYPE
} from '../types'

export class InferListType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (valueTypes: Type[]): Type => {
    try {
      return valueTypes.reduce((valueType, otherValueType) => {
        return valueType.unify(otherValueType)
      }, new ParametricType(LIST_TYPE, [new TypeVariable]))
    } catch (error) {
      this.errorHandler.throw(
        `Values of list have varying types.\n\n${error.message}`,
        this.node
      )
    }
  }
}
