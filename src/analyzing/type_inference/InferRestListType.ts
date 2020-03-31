import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'
import { assert } from '../../utilities'

import {
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  LIST_TYPE
} from '../types'

export class InferRestListType {
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

  perform = (type: Type): Type => {
    try {
      const unifiedType = type.unify(
        new ParametricType(LIST_TYPE, [new TypeVariable]),
        this.typeConstraints
      )
      assert(
        unifiedType instanceof ParametricType,
        'List type should be parametric.'
      )

      return unifiedType.parameters[0]
    } catch (error) {
      this.errorHandler.throw(
        `Type '${type.toString()}' not assignable to list type.\n\n` +
        `${error.message}`,
        this.node
      )
    }
  }
}
