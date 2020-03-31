import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ParametricType,
  Type,
  TypeConstraints,
  BOOLEAN_TYPE
} from '../types'

export class CheckConditionType {
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

  perform = (conditionType: Type): void => {
    try {
      conditionType.unify(
        new ParametricType(BOOLEAN_TYPE),
        this.typeConstraints
      )
    } catch (error) {
      this.errorHandler.throw(
        `Type '${conditionType.toString()}' not assignable to type ` +
        `'${BOOLEAN_TYPE}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
