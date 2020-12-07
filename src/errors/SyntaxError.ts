import { Tree } from 'tree-sitter-tony'

export class SyntaxError extends Error {
  private _filePath: string
  private _tree: Tree

  constructor(filePath: string, tree: Tree) {
    super(undefined)
    this.name = this.constructor.name

    this._filePath = filePath
    this._tree = tree
  }

  get filePath(): string {
    return this._filePath
  }

  get tree(): Tree {
    return this._tree
  }
}
