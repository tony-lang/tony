import { AbstractionBranch } from './AbstractionBranch'
import { SyntaxNode } from './SyntaxNode'

export class Abstraction extends SyntaxNode {
  private _branches: AbstractionBranch[]

  constructor(branches: AbstractionBranch[]) {
    super()

    this._branches = branches
  }

  get branches(): AbstractionBranch[] {
    return this._branches
  }
}
