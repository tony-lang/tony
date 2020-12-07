import { Block } from './Block'
import { ElseIf } from './ElseIf'
import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class If extends SyntaxNode {
  private _body: Block
  private _condition: Expression
  private _else: Block | undefined
  private _elseIfs: ElseIf[]

  constructor(
    condition: Expression,
    body: Block,
    elseIfs: ElseIf[] = [],
    els?: Block,
  ) {
    super()

    this._body = body
    this._condition = condition
    this._else = els
    this._elseIfs = elseIfs
  }

  get body(): Block {
    return this._body
  }

  get condition(): Expression {
    return this._condition
  }

  get else(): Block | undefined {
    return this._else
  }

  get elseIfs(): ElseIf[] {
    return this._elseIfs
  }
}
