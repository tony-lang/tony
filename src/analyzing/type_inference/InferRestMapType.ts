import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  MapType,
  ObjectType,
  SingleTypeConstructor,
  TypeConstructor
} from '../types'

export class InferRestMapType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (typeConstructor: TypeConstructor): TypeConstructor => {
    if (typeConstructor instanceof SingleTypeConstructor &&
        (typeConstructor.type instanceof MapType ||
        typeConstructor.type instanceof ObjectType)) return typeConstructor

    this.throwRestMapTypeMismatch(typeConstructor)
  }

  private throwRestMapTypeMismatch = (
    typeConstructor: TypeConstructor
  ): void => {
    this.errorHandler.throw(
      'Rest map operator may only be used on map or object types, got ' +
      `'${typeConstructor.toString()}'`,
      this.node
    )
  }
}
