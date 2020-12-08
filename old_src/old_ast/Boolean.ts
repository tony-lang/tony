import { SyntaxNode } from './SyntaxNode'

export class Boolean extends SyntaxNode {
  private _text: string

  constructor(text: string) {
    super()

    this._text = text
  }

  get text(): string {
    return this._text
  }

  get value(): boolean {
    return this.text === 'true'
  }
}
