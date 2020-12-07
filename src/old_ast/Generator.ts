import { Expression } from './Expression'
import { SyntaxNode } from './SyntaxNode'

export class Generator extends SyntaxNode {
  private _condition: Expression | undefined
  private _name: string
  private _transformedName: string
  private _value: Expression

  constructor(
    name: string,
    transformedName: string,
    value: Expression,
    condition?: Expression,
  ) {
    super()

    this._condition = condition
    this._name = name
    this._transformedName = transformedName
    this._value = value
  }

  get condition(): Expression | undefined {
    return this._condition
  }

  get name(): string {
    return this._name
  }

  get transformedName(): string {
    return this._transformedName
  }

  get value(): Expression {
    return this._value
  }
}
