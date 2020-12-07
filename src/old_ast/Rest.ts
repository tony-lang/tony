import { IdentifierPattern } from './IdentifierPattern'
import { SyntaxNode } from './SyntaxNode'

export abstract class Rest extends SyntaxNode {
  private _name: IdentifierPattern

  constructor(name: IdentifierPattern) {
    super()

    this._name = name
  }

  get name(): IdentifierPattern {
    return this._name
  }
}

export class RestList extends Rest {}
export class RestMap extends Rest {}
export class RestTuple extends Rest {}
