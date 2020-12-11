import { Import } from './Import'
import { ParametricType } from '../../types'
import { SyntaxNode } from 'tree-sitter-tony'

export class ModuleImport implements Import {
  private _alias: ParametricType | undefined
  private _filePath: string
  private _name: ParametricType
  private _node: SyntaxNode

  constructor(
    node: SyntaxNode,
    filePath: string,
    name: ParametricType,
    alias?: ParametricType,
  ) {
    this._alias = alias
    this._filePath = filePath
    this._name = name
    this._node = node
  }

  get alias(): string {
    if (this._alias) return this._alias.name
    else return this.name
  }

  get aliasType(): ParametricType {
    if (this._alias) return this._alias
    else return this._name
  }

  get filePath(): string {
    return this._filePath
  }

  get name(): string {
    return this._name.name
  }

  get node(): SyntaxNode {
    return this._node
  }
}