import { Block } from './Block'
import { SyntaxNode } from './SyntaxNode'

export class Module extends SyntaxNode {
  private _body: Block
  private _name: string

  constructor(name: string, body: Block) {
    super()

    this._body = body
    this._name = name
  }

  get body(): Block {
    return this._body
  }

  get name(): string {
    return this._name
  }
}
