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

  constructor(message?: string) {
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

  private addContext = (node: Parser.SyntaxNode): void => {
    this._context = {
      start: node.startPosition,
      end: node.endPosition,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static addContext = <T extends Array<any>, U>(
    fn: (node: Parser.SyntaxNode, ...args: T) => U,
    node: Parser.SyntaxNode,
    ...args: T
  ): U => {
    try {
      return fn(node, ...args)
    } catch (error) {
      if (error instanceof CompileError && error.context === undefined)
        error.addContext(node)
      throw error
    }
  }
}
