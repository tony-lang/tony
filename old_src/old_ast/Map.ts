import { ExpressionPair } from './ExpressionPair'
import { ShorthandPairIdentifier } from './ShorthandPairIdentifier'
import { SpreadMap } from './Spread'
import { SyntaxNode } from './SyntaxNode'

export type MapElement = ExpressionPair | ShorthandPairIdentifier | SpreadMap

export class Map extends SyntaxNode {
  private _elements: MapElement[]

  constructor(elements: MapElement[]) {
    super()

    this._elements = elements
  }

  get elements(): MapElement[] {
    return this._elements
  }
}
