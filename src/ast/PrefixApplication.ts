import { Expression } from './Expression'
import { Identifier } from './Identifier'
import { SyntaxNode } from './SyntaxNode'

export class PrefixApplication extends SyntaxNode {
  private _argument: Expression
  private _value: Identifier

  constructor(value: Identifier, argument: Expression) {
    super()

    this._argument = argument
    this._value = value
  }

  get argument(): Expression {
    return this._argument
  }

  get value(): Identifier {
    return this._value
  }
}
