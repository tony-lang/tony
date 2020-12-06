import { Block } from './Block'
import { Pattern } from './Pattern'
import { SyntaxNode } from './SyntaxNode'

export class When extends SyntaxNode {
  private _body: Block
  private _patterns: Pattern[]

  constructor(patterns: Pattern[], body: Block) {
    super()

    this._body = body
    this._patterns = patterns
  }

  get body(): Block {
    return this._body
  }

  get patterns(): Pattern[] {
    return this._patterns
  }
}
