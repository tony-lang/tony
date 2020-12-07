import { Expression } from './Expression'
import { Identifier } from './Identifier'
import { SyntaxNode } from './SyntaxNode'

export class InfixApplication extends SyntaxNode {
  private _left: Expression
  private _right: Expression
  private _value: Identifier

  constructor(left: Expression, value: Identifier, right: Expression) {
    super()

    this._left = left
    this._right = right
    this._value = value
  }

  get left(): Expression {
    return this._left
  }

  get right(): Expression {
    return this._right
  }

  get value(): Identifier {
    return this._value
  }
}
