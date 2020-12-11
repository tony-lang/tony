import { Pattern } from './Pattern'
import { SyntaxNode } from './SyntaxNode'

export class TuplePattern extends SyntaxNode {
  private _elements: Pattern[]

  constructor(elements: Pattern[]) {
    super()

    this._elements = elements
  }

  get elements(): Pattern[] {
    return this._elements
  }
}