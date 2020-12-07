import { SyntaxNode } from './SyntaxNode'
import { Type } from '../types'

export class Identifier extends SyntaxNode {
  private _name: string
  private _transformedName: string
  private _type: Type

  constructor(type: Type, name: string, transformedName: string) {
    super()

    this._name = name
    this._transformedName = transformedName
    this._type = type
  }

  get name(): string {
    return this._name
  }

  get transformedName(): string {
    return this._transformedName
  }

  get type(): Type {
    return this._type
  }
}
