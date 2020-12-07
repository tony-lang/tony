import { Expression } from './Expression'
import { SpreadTuple } from './Spread'
import { SyntaxNode } from './SyntaxNode'

type Element = Expression | SpreadTuple

export class Tuple extends SyntaxNode {
  private _elements: Element[]

  constructor(elements: Element[]) {
    super()

    this._elements = elements
  }

  get elements(): Element[] {
    return this._elements
  }
}
