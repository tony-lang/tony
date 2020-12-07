import { SyntaxNode } from './SyntaxNode'

export class ShorthandPairIdentifier extends SyntaxNode {
  private _name: string
  private _transformedName: string

  constructor(name: string, transformedName: string) {
    super()

    this._name = name
    this._transformedName = transformedName
  }

  get name(): string {
    return this._name
  }

  get transformedName(): string {
    return this._transformedName
  }
}
