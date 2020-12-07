import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class Block extends SyntaxNode {
  private _expressions: Expression[]

  constructor(expressions: Expression[]) {
    super()

    this._expressions = expressions
  }

  get expressions(): Expression[] {
    return this._expressions
  }
}
