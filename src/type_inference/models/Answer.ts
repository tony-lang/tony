import * as AST from '../../ast'
import { Type, TypeConstraint } from '../../types'

export class Answer<T extends AST.SyntaxNode> {
  private _node: T
  private _typeConstraint: TypeConstraint<Type>

  constructor(node: T, typeConstraint: TypeConstraint<Type>) {
    this._node = node
    this._typeConstraint = typeConstraint
  }

  get node(): T {
    return this._node
  }

  get typeConstraint(): TypeConstraint<Type> {
    return this._typeConstraint
  }

  static build = <T>(
    node: T,
    typeConstraint?: TypeConstraint<Type>,
  ): Answer<T> | undefined => {
    if (typeConstraint === undefined) return

    return new Answer(node, typeConstraint)
  }
}
