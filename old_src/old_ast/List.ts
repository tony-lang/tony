import { Expression } from './Expression'
import { SpreadList } from './Spread'
import { SyntaxNode } from './SyntaxNode'

type Element = Expression | SpreadList

export class List extends SyntaxNode {
  private _elements: Element[]

  constructor(elements: Element[]) {
    super()

    this._elements = elements
  }

  get elements(): Element[] {
    return this._elements
  }
}
