import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { TypeConstructor } from '../types'

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
    this.checkInvalidType(patternType)
    this.checkInvalidType(valueType)
    this.checkIncompleteType(patternType, valueType)
    this.checkTypeMismatch(patternType, valueType)

    return valueType
  }

  private checkInvalidType = (type: TypeConstructor): void => {
    if (type.isValid()) return

    this.errorHandler.throw(`Type '${type.toString()}' is invalid`, this.node)
  }

  private checkIncompleteType = (
    patternType: TypeConstructor,
    valueType: TypeConstructor
  ): void => {
    if (valueType.isComplete() || patternType.isComplete()) return

    this.errorHandler.throw(
      'Provided type information is incomplete, tried to match pattern ' +
      `type '${patternType.toString()}' against value type ` +
      `'${valueType.toString()}'`,
      this.node
    )
  }

  private checkTypeMismatch = (
    patternType: TypeConstructor,
    valueType: TypeConstructor
  ): void => {
    if ((!valueType.isComplete() || valueType.matches(patternType)) &&
        (valueType.isComplete() || patternType.matches(valueType))) return

    this.errorHandler.throw(
      `Pattern type '${patternType.toString()}' and expression type ` +
      `'${valueType.toString()}' do not match`,
      this.node
    )
  }
}
