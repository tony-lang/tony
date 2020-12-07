import { Block } from './Block'
import { Parameters } from './Parameters'
import { SyntaxNode } from './SyntaxNode'

export class AbstractionBranch extends SyntaxNode {
  private _body: Block
  private _parameters: Parameters

  constructor(parameters: Parameters, body: Block) {
    super()

    this._parameters = parameters
    this._body = body
  }

  get body(): Block {
    return this._body
  }

  get parameters(): Parameters {
    return this._parameters
  }
}
