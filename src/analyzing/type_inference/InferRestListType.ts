import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  CurriedTypeConstructor,
  ListType,
  SingleTypeConstructor,
  TupleType,
  TypeConstructor
} from '../types'

export class InferRestListType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (
    typeConstructor: TypeConstructor,
    allowTuple = true
  ): TypeConstructor => {
    if (typeConstructor instanceof SingleTypeConstructor &&
        typeConstructor.type instanceof ListType) {
      typeConstructor.type.isRest = true

      return typeConstructor
    } else if (allowTuple && typeConstructor instanceof SingleTypeConstructor &&
              typeConstructor.type instanceof TupleType)
      return new CurriedTypeConstructor(typeConstructor.type.types)

    this.throwRestListTypeMismatch(typeConstructor, allowTuple)
  }

  private throwRestListTypeMismatch = (
    typeConstructor: TypeConstructor,
    allowTuple: boolean
  ): void => {
    this.errorHandler.throw(
      'Rest list operator may only be used on list' +
      `${allowTuple ? ' or tuple' : ''} types, got ` +
      `'${typeConstructor.toString()}'`,
      this.node
    )
  }
}
