import { Interpolation } from './Interpolation'
import { SyntaxNode } from './SyntaxNode'

export class String extends SyntaxNode {
  private _content: string
  private _interpolations: Interpolation[]

  constructor(content: string, interpolations: Interpolation[]) {
    super()

    this._content = content
    this._interpolations = interpolations
  }

  get content(): string {
    return this._content
  }

  get interpolations(): Interpolation[] {
    return this._interpolations
  }
}
