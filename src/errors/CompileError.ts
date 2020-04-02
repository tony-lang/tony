import Parser from 'tree-sitter'

type Position = {
  row: number
  column: number
}

export type Context = {
  start: Position
  end: Position
}

export abstract class CompileError extends Error {
  private _context: Context | undefined
  private _filePath: string | undefined

  constructor(message: string | undefined) {
    super(message)
  }

  get context(): Context | undefined {
    return this._context
  }

  get filePath(): string | undefined {
    return this._filePath
  }

  set filePath(value: string | undefined) {
    this._filePath = value
  }

  addContext = (node: Parser.SyntaxNode): void => {
    this._context = {
      start: node.startPosition,
      end: node.endPosition,
    }
  }
}
