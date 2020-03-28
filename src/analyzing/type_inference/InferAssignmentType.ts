import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { SingleTypeConstructor, TupleType, TypeConstructor } from '../types'

export class InferAssignmentType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (
    patternType: TypeConstructor,
    valueType: TypeConstructor
  ): TypeConstructor => {
    this.checkIncompleteType(patternType, valueType)
    this.checkTypeMismatch(patternType, valueType)

    return valueType
  }

  private checkIncompleteType = (
    patternType: TypeConstructor,
    valueType: TypeConstructor
  ): void => {
    if (valueType.isValid() || patternType.isValid()) return

    this.errorHandler.throw(
      'Provided type information is incomplete, tried to match pattern ' +
      `type '${patternType.toString()}' against expression type ` +
      `'${valueType.toString()}'`,
      this.node
    )
  }

  private checkTypeMismatch = (
    patternType: TypeConstructor,
    valueType: TypeConstructor
  ): void => {
    if ((!valueType.isValid() || valueType.matches(patternType)) &&
        (valueType.isValid() || patternType.matches(valueType))) return

    this.errorHandler.throw(
      `Pattern type '${patternType.toString()}' and expression type ` +
      `'${valueType.toString()}' do not match`,
      this.node
    )
  }
}
