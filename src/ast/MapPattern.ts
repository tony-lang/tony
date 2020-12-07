import { PatternPair } from './PatternPair'
import { RestMap } from './Rest'
import { ShorthandPairIdentifierPattern } from './ShorthandPairIdentifierPattern'
import { SyntaxNode } from './SyntaxNode'

export type MapPatternElement =
  | PatternPair
  | ShorthandPairIdentifierPattern
  | RestMap

export class MapPattern extends SyntaxNode {
  private _elements: MapPatternElement[]

  constructor(elements: MapPatternElement[]) {
    super()

    this._elements = elements
  }

  get elements(): MapPatternElement[] {
    return this._elements
  }
}
