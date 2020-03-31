import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { ParametricType, Type, TUPLE_TYPE } from '../types'

export class InferTupleType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (valueTypes: Type[], restValueTypes: Type[]): Type => {
    const parameters = restValueTypes.reduce((valueTypes, restValueType) => {
      if (restValueType instanceof ParametricType &&
          restValueType.name === TUPLE_TYPE)
        return valueTypes.concat(restValueType.parameters)

      this.errorHandler.throw(
        `Type '${restValueType.toString()}' not assignable to type ` +
        `'${TUPLE_TYPE}'.`,
        this.node
      )
    }, valueTypes)

    return new ParametricType(TUPLE_TYPE, parameters)
  }
}
