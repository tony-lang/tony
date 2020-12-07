import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class Interpolation extends SyntaxNode {
  private _value: Expression

  constructor(value: Expression) {
    super()

    this._value = value
  }

  get value(): Expression {
    return this._value
  }
}
