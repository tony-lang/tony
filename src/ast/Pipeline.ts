import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class Pipeline extends SyntaxNode {
  private _argument: Expression
  private _value: Expression

  constructor(value: Expression, argument: Expression) {
    super()

    this._argument = argument
    this._value = value
  }

  get argument(): Expression {
    return this._argument
  }

  get value(): Expression {
    return this._value
  }
}
