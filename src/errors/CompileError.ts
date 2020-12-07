import { Node } from '../types/ast'
import { Path } from '../types/util'

export type Context = {
  filePath: Path
  node: Node
}

export abstract class CompileError extends Error {
  private _context: Context

  constructor(context: Context, message?: string) {
    super(message)
    this.name = this.constructor.name

    this._context = context
  }

  get context(): Context | undefined {
    return this._context
  }
}
