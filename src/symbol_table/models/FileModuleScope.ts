import * as AST from '../../ast'
import { GlobalScope } from './GlobalScope'
import { Import } from './Import'
import { ModuleScope } from './ModuleScope'
import Parser from 'tree-sitter'
import { Scope } from './Scope'
import { assert } from '../../errors'

export class FileModuleScope extends ModuleScope {
  private _dependencies: string[] = []
  private _filePath: string
  private _imports: Import[] = []
  private _tree: Parser.Tree | undefined
  private _annotatedTree: AST.Program | undefined

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

  get imports(): Import[] {
    return this._imports
  }

  get parentScope(): GlobalScope {
    const parentScope = super.parentScope
    assert(
      parentScope instanceof GlobalScope,
      'Parent scope of file-level module scope should be the global scope.',
    )

    return parentScope
  }

  get tree(): Parser.Tree | undefined {
    return this._tree
  }

  set tree(value: Parser.Tree | undefined) {
    this._tree = value
  }

  get annotatedTree(): AST.Program | undefined {
    return this._annotatedTree
  }

  set annotatedTree(value: AST.Program | undefined) {
    this._annotatedTree = value
  }

  addDependency = (filePath: string): void => {
    this._dependencies = [...this.dependencies, filePath]
  }

  isBound = (name: string, depth?: number): boolean =>
    this.resolveBindings(name, depth).length > 0 ||
    this.imports.filter((imp) => imp.alias === name).length > 0

  addImport = (imp: Import): void => {
    this._imports = [imp, ...this.imports]
  }
}
