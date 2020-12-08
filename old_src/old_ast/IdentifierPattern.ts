import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class IdentifierPattern extends SyntaxNode {
  private _default: Expression | undefined
  private _name: string
  private _transformedName: string

  constructor(name: string, transformedName: string, def?: Expression) {
    super()

    this._default = def
    this._name = name
    this._transformedName = transformedName
  }

  get default(): Expression | undefined {
    return this._default
  }

  get name(): string {
    return this._name
  }

  get transformedName(): string {
    return this._transformedName
  }
}
