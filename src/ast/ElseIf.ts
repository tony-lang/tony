import { Block } from './Block'
import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class ElseIf extends SyntaxNode {
  private _body: Block
  private _condition: Expression

  constructor(condition: Expression, body: Block) {
    super()

    this._body = body
    this._condition = condition
  }

  get body(): Block {
    return this._body
  }

  get condition(): Expression {
    return this._condition
  }
}
