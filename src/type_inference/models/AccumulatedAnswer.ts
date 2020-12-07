import * as AST from '../../ast'
import { Type, TypeConstraint } from '../../types'
import { Answer } from './Answer'

export class AccumulatedAnswer<T extends AST.SyntaxNode> {
  private _answers: Answer<T>[]

  constructor(answers: Answer<T>[] = []) {
    this._answers = answers
  }

  get answers(): Answer<T>[] {
    return this._answers
  }

  get nodes(): T[] {
    return this._answers.map((answer) => answer.node)
  }

  get typeConstraints(): TypeConstraint<Type>[] {
    return this._answers.map((answer) => answer.typeConstraint)
  }
}
