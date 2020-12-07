import { Expression } from './Expression'
import { ShorthandAccessIdentifier } from './ShorthandAccessIdentifier'
import { SyntaxNode } from './SyntaxNode'

type Key = ShorthandAccessIdentifier | Expression

export class ExpressionPair extends SyntaxNode {
  private _key: Key
  private _value: Expression

  constructor(key: Key, value: Expression) {
    super()

    this._key = key
    this._value = value
  }

  get key(): Key {
    return this._key
  }

  get value(): Expression {
    return this._value
  }
}
