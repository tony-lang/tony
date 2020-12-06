import * as AST from '../../ast'
import { GenerateCode } from '../GenerateCode'
import { InternalError } from '../../errors'

export class CollectDefaultValues {
  private codeGenerator: GenerateCode

  constructor(codeGenerator: GenerateCode) {
    this.codeGenerator = codeGenerator
  }

  perform = (node: AST.Pattern | AST.Parameters): string =>
    `[${this.traverse(node).join(',')}]`

  // eslint-disable-next-line max-lines-per-function
  private traverse = (
    node: AST.Pattern | AST.Parameters,
  ): (string | undefined)[] => {
    if (
      node instanceof AST.IdentifierPattern ||
      node instanceof AST.ShorthandPairIdentifierPattern
    )
      if (node.default) return [this.codeGenerator.traverse(node.default)]
      else return [undefined]
    else if (node instanceof AST.ListPattern)
      return this.handleWrapper(node.elements)
    else if (node instanceof AST.MapPattern)
      return this.handleWrapper(node.elements)
    else if (node instanceof AST.Parameters)
      return this.handleWrapper(node.parameters)
    else if (node instanceof AST.TuplePattern)
      return this.handleWrapper(node.elements)
    else if (
      node instanceof AST.Boolean ||
      node instanceof AST.Number ||
      node instanceof AST.Regex ||
      node instanceof AST.StringPattern ||
      node instanceof AST.ParametricType
    )
      return []

    throw new InternalError(
      'Could not find generator for AST node ' + `'${node.constructor.name}'.`,
    )
  }

  private handleWrapper = (
    nodes: (AST.Pattern | AST.Parameters)[],
  ): (string | undefined)[] =>
    nodes.map(this.traverse).reduce((acc, value) => acc.concat(value), [])
}
