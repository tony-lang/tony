import { DestructuringPattern } from './DestructuringPattern'
import { Expression } from './Expression'
import { IdentifierPattern } from './IdentifierPattern'
import { SyntaxNode } from './SyntaxNode'

export type AssignablePattern = IdentifierPattern | DestructuringPattern

export class Assignment extends SyntaxNode {
  private _pattern: AssignablePattern
  private _value: Expression

  constructor(pattern: AssignablePattern, value: Expression) {
    super()

    this._pattern = pattern
    this._value = value
  }

  get pattern(): AssignablePattern {
    return this._pattern
  }

  get value(): Expression {
    return this._value
  }
}
