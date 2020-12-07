import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class Return extends SyntaxNode {
  private _value: Expression | undefined

  constructor(value?: Expression) {
    super()

    this._value = value
  }

  get value(): Expression | undefined {
    return this._value
  }
}
