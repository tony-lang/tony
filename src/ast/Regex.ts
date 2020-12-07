import { SyntaxNode } from './SyntaxNode'

export class Regex extends SyntaxNode {
  private _text: string

  constructor(text: string) {
    super()

    this._text = text
  }

  get text(): string {
    return this._text
  }

  get value(): RegExp {
    return new RegExp(this.text)
  }
}
