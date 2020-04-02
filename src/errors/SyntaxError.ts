import Parser from 'tree-sitter'

export class SyntaxError extends Error {
  private _filePath: string
  private _tree: Parser.Tree

  constructor(filePath: string, tree: Parser.Tree) {
    super(undefined)
    this.name = this.constructor.name

    this._filePath = filePath
    this._tree = tree
  }

  get filePath(): string {
    return this._filePath
  }

  get tree(): Parser.Tree {
    return this._tree
  }
}
