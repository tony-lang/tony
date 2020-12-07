import { Argument } from './Argument'
import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class Application extends SyntaxNode {
  private _arguments: Argument[]
  private _value: Expression

  constructor(value: Expression, args: Argument[]) {
    super()

    this._arguments = args
    this._value = value
  }

  get arguments(): Argument[] {
    return this._arguments
  }

  get value(): Expression {
    return this._value
  }
}
