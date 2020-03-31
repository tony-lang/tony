import Parser from 'tree-sitter'

import { readFile } from '../utilities'

const CONTEXT_DELTA = Object.freeze(2)

type Point = {
  row: number;
  column: number;
}
type Range = {
  start: Point;
  end: Point;
}

export class ErrorHandler {
  private file: string

  constructor(file?: string) {
    this.file = file
  }

  throw = async (message: string, node?: Parser.SyntaxNode): Promise<void> => {
    console.log(message)
    // if (node) await this.printContext(ErrorHandler.getRangeForNode(node))

    process.exit(1)
  }

  private printContext = async (range: Range): Promise<void> => {
    if (this.file === null) return

    const fileContent = await readFile(this.file)
    const context = fileContent
      .split('\n')
      .slice(
        range.start.column - CONTEXT_DELTA,
        range.end.column + CONTEXT_DELTA
      )
      .join('\n')

    // TODO: add highlighting
    console.log(context)
  }

  static getRangeForNode = (node: Parser.SyntaxNode): Range =>
    ({ start: node.startPosition, end: node.endPosition })
}
