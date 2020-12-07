import { Binding } from './Binding'
import { ParametricType } from '../../types/util'
import { SyntaxNode } from 'tree-sitter-tony'

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

  get node(): SyntaxNode | undefined {
    return undefined
  }

  get transformedName(): string {
    return this.name
  }

  get transformedImportName(): string | undefined {
    return undefined
  }
}
