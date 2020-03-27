import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  MapType,
  SingleTypeConstructor,
  TypeConstructor,
  MISSING_TYPE
} from '../types'

const DEFAULT_MAP_TYPE =
  new SingleTypeConstructor(new MapType(MISSING_TYPE, MISSING_TYPE))

export class InferMapType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (mapTypes: TypeConstructor[]): TypeConstructor => {
    this.checkMapVaryingEntriesTypes(mapTypes)

    return this.inferType(mapTypes)
  }

  private inferType = (mapTypes: TypeConstructor[]): TypeConstructor =>
    mapTypes[0] || DEFAULT_MAP_TYPE

  private checkMapVaryingEntriesTypes = (mapTypes: TypeConstructor[]): void => {
    const mapType = mapTypes[0]
    const varyingMapType = mapTypes
      .find(otherMapType => {
        return !otherMapType.matches(mapType)
      })

    if (varyingMapType)
      this.errorHandler.throw(
        'Keys or values of map have varying types, got ' +
        `'${varyingMapType.toString()}', expected '${mapType.toString()}'`,
        this.node
      )
  }
}
