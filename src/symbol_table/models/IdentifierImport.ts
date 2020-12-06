import { Import } from './Import'
import { ParametricType } from '../../types'
import Parser from 'tree-sitter'

export class IdentifierImport implements Import {
  private _alias: string | undefined
  private _filePath: string
  private _name: string
  private _node: Parser.SyntaxNode
  private _type: ParametricType

  constructor(
    node: Parser.SyntaxNode,
    filePath: string,
    type: ParametricType,
    name: string,
    alias?: string,
  ) {
    this._alias = alias
    this._filePath = filePath
    this._name = name
    this._node = node
    this._type = type
  }

  get alias(): string {
    return this._alias || this.name
  }

  get filePath(): string {
    return this._filePath
  }

  get name(): string {
    return this._name
  }

  get node(): Parser.SyntaxNode {
    return this._node
  }

  get type(): ParametricType {
    return this._type
  }
}
