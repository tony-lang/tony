import { Pattern } from './Pattern'
import { RestTuple } from './Rest'
import { SyntaxNode } from './SyntaxNode'

type Parameter = Pattern | RestTuple

export class Parameters extends SyntaxNode {
  private _parameters: Parameter[]

  constructor(parameters: Parameter[] = []) {
    super()

    this._parameters = parameters
  }

  get parameters(): Parameter[] {
    return this._parameters
  }
}
