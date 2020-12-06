import { SyntaxNode } from './SyntaxNode'

export class Number extends SyntaxNode {
  private _text: string

  constructor(text: string) {
    super()

    this._text = text
  }

  get text(): string {
    return this._text
  }

  get value(): number {
    return parseInt(this.text)
  }
}
