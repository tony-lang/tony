import { SyntaxNode } from './SyntaxNode'

export class StringPattern extends SyntaxNode {
  private _content: string

  constructor(content: string) {
    super()

    this._content = content
  }

  get content(): string {
    return this._content
  }
}
