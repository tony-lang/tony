import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ListType,
  MapType,
  SingleTypeConstructor,
  TupleType,
  TypeConstructor
} from '../types'

export class InferSpreadType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (valueType: TypeConstructor): TypeConstructor => {
    if (valueType instanceof SingleTypeConstructor &&
        valueType.type instanceof ListType)
      return valueType.type.type
    else if (valueType instanceof SingleTypeConstructor &&
             valueType.type instanceof TupleType) {
      valueType.type.isRest = true

      return valueType
    } else if (valueType instanceof SingleTypeConstructor &&
               valueType.type instanceof MapType)
      return valueType

    this.throwSpreadTypeMismatch(valueType)
  }

  private throwSpreadTypeMismatch = (
    valueType: TypeConstructor
  ): void => {
    this.errorHandler.throw(
      'Spread operator may only be used on values of list, tuple or map ' +
      `types, got '${valueType.toString()}'`,
      this.node
    )
  }
}
