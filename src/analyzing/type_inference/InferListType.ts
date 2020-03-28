import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  ListType,
  SingleTypeConstructor,
  Type,
  TypeConstructor,
  MISSING_TYPE
} from '../types'

const DEFAULT_VALUE_TYPE = new SingleTypeConstructor(new Type(MISSING_TYPE, true))

export class InferListType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (valueTypes: TypeConstructor[]): TypeConstructor => {
    this.checkListVaryingValueTypes(valueTypes)

    return this.inferType(valueTypes)
  }

  private inferType = (valueTypes: TypeConstructor[]): TypeConstructor =>
    new SingleTypeConstructor(new ListType(valueTypes[0] || DEFAULT_VALUE_TYPE))

  private checkListVaryingValueTypes = (
    valueTypes: TypeConstructor[]
  ): void => {
    const valueType = valueTypes[0]
    const varyingValueType = valueTypes
      .find(otherValueType => {
        return !otherValueType.matches(valueType)
      })

    if (varyingValueType)
      this.errorHandler.throw(
        'Values of list have varying types, got ' +
        `'${varyingValueType.toString()}', expected '${valueType.toString()}'`,
        this.node
      )
  }
}
