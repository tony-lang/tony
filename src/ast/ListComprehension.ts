import { Block } from './Block'
import { Generator } from './Generator'
import { SyntaxNode } from './SyntaxNode'

export class ListComprehension extends SyntaxNode {
  private _body: Block
  private _generators: Generator[]

  constructor(body: Block, generators: Generator[]) {
    super()

    this._body = body
    this._generators = generators
  }

  get body(): Block {
    return this._body
  }

  get generators(): Generator[] {
    return this._generators
  }
}
