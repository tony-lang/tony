import { Block } from './Block'
import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'
import { When } from './When'

export class Case extends SyntaxNode {
  private _branches: When[]
  private _else: Block | undefined
  private _value: Expression

  constructor(value: Expression, branches: When[], els?: Block) {
    super()

    this._branches = branches
    this._else = els
    this._value = value
  }

  get branches(): When[] {
    return this._branches
  }

  get else(): Block | undefined {
    return this._else
  }

  get value(): Expression {
    return this._value
  }
}
