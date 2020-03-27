import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'
import { assert } from '../../utilities'

import {
  MapType,
  ObjectType,
  SingleTypeConstructor,
  TypeConstructor
} from '../types'

import { InferMapType } from './InferMapType'

export class InferMapPatternType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (objectTypes: TypeConstructor[]): TypeConstructor => {
    const mapType = this.findMapType(objectTypes)
    if (mapType)
      return new InferMapType(this.node, this.errorHandler).perform(objectTypes)

    return this.inferType(objectTypes)
  }

  private inferType = (objectTypes: TypeConstructor[]): TypeConstructor =>
    objectTypes.reduce((type: SingleTypeConstructor, objectType) => {
      assert(
        objectType instanceof SingleTypeConstructor,
        'Map pattern must be non-curried.'
      )
      assert(
        type.type instanceof ObjectType &&
        objectType.type instanceof ObjectType,
        'Map pattern must be either of a map or an object type.'
      )

      return new SingleTypeConstructor(type.type.concat(objectType.type))
    }, new SingleTypeConstructor(new ObjectType(new Map())))

  private findMapType = (objectTypes: TypeConstructor[]): TypeConstructor =>
    objectTypes.find(objectType => {
      assert(
        objectType instanceof SingleTypeConstructor,
        'Map pattern must be non-curried.'
      )

      return objectType.type instanceof MapType
    })
}
