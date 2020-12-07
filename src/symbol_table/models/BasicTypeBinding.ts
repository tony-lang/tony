import { Binding } from './Binding'
import { ParametricType } from '../../types'
import Parser from 'tree-sitter'

export class BasicTypeBinding implements Binding {
  private _name: ParametricType

  constructor(name: ParametricType) {
    this._name = name
  }

  get filePath(): string | undefined {
    return undefined
  }

  get isExported(): boolean {
    return false
  }

  get isImplicit(): boolean {
    return false
  }

  get isImported(): boolean {
    return false
  }

  get name(): string {
    return this._name.name
  }

  get node(): Parser.SyntaxNode | undefined {
    return undefined
  }

  get transformedName(): string {
    return this.name
  }

  get transformedImportName(): string | undefined {
    return undefined
  }
}
