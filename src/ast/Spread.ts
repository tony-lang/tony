import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export abstract class Spread extends SyntaxNode {
  private _value: Expression

  constructor(value: Expression) {
    super()

    this._value = value
  }

  get value(): Expression {
    return this._value
  }
}

export class SpreadList extends Spread {}
export class SpreadMap extends Spread {}
export class SpreadTuple extends Spread {}
