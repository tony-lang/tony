import { Declaration } from './Declaration'
import { SyntaxNode } from './SyntaxNode'

export class Export extends SyntaxNode {
  private _declaration: Declaration

  constructor(declaration: Declaration) {
    super()

    this._declaration = declaration
  }

  get declaration(): Declaration {
    return this._declaration
  }
}
