import { SyntaxNode } from './SyntaxNode'

export class ShorthandAccessIdentifier extends SyntaxNode {
  private _name: string
  private _transformedName: string | undefined

  constructor(name: string, transformedName?: string) {
    super()

    this._name = name
    this._transformedName = transformedName
  }

  get name(): string {
    return this._name
  }

  get transformedName(): string | undefined {
    return this._transformedName
  }
}
