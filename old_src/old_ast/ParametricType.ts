import { SyntaxNode } from './SyntaxNode'

export class ParametricType extends SyntaxNode {
  private _name: string

  constructor(name: string) {
    super()

    this._name = name
  }

  get name(): string {
    return this._name
  }
}
