import { Expression } from './Expression'
import { Pattern } from './Pattern'
import { ShorthandAccessIdentifier } from './ShorthandAccessIdentifier'
import { SyntaxNode } from './SyntaxNode'

type Key = ShorthandAccessIdentifier | Expression

export class PatternPair extends SyntaxNode {
  private _key: Key
  private _value: Pattern

  constructor(key: Key, value: Pattern) {
    super()

    this._key = key
    this._value = value
  }

  get key(): Key {
    return this._key
  }

  get value(): Pattern {
    return this._value
  }
}
