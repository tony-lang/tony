import Parser from 'tree-sitter'

type Position = {
  row: number;
  column: number;
}

export type Context = {
  start: Position;
  end: Position;
}

export abstract class CompileError extends Error {
  private _context: Context
  private _filePath: string

  constructor(message: string) {
    super(message)
  }

  get context(): Context {
    return this._context
  }

  get filePath(): string {
    return this._filePath
  }

  set filePath(value: string) {
    this._filePath = value
  }

  addContext = (node: Parser.SyntaxNode): void => {
    this._context = {
      start: node.startPosition,
      end: node.endPosition
    }
  }
}
