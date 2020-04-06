import { ModuleScope } from './ModuleScope'
import Parser from 'tree-sitter'
import { Scope } from './Scope'

export class FileModuleScope extends ModuleScope {
  private _dependencies: string[] = []
  private _filePath: string
  private _tree: Parser.Tree | undefined

  constructor(parentScope: Scope, filePath: string) {
    super(parentScope)

    this._filePath = filePath
  }

  get dependencies(): string[] {
    return this._dependencies
  }

  get filePath(): string {
    return this._filePath
  }

  get tree(): Parser.Tree | undefined {
    return this._tree
  }

  set tree(value: Parser.Tree | undefined) {
    this._tree = value
  }

  addDependency = (filePath: string): void => {
    this._dependencies = [...this.dependencies, filePath]
  }
}
