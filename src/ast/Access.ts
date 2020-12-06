import { Expression } from './Expression'
import { ShorthandAccessIdentifier } from './ShorthandAccessIdentifier'
import { SyntaxNode } from './SyntaxNode'

type Accessor = ShorthandAccessIdentifier | Expression

export class Access extends SyntaxNode {
  private _value: Expression
  private _accessor: Accessor

  constructor(value: Expression, accessor: Accessor) {
    super()

    this._value = value
    this._accessor = accessor
  }

  get value(): Expression {
    return this._value
  }

  get accessor(): Accessor {
    return this._accessor
  }
}
