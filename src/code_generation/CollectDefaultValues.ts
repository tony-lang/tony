import Parser from 'tree-sitter'

import { GenerateCode } from './GenerateCode'
import { NODE_TYPES_WITH_DEFAULT_VALUES } from '../constants'

export class CollectDefaultValues {
  private codeGenerator: GenerateCode

  constructor(codeGenerator: GenerateCode) {
    this.codeGenerator = codeGenerator
  }

  perform = (node: Parser.SyntaxNode): string => `[${this.rec(node).join(',')}]`

  rec = (node: Parser.SyntaxNode): string[] => {
    if (NODE_TYPES_WITH_DEFAULT_VALUES.includes(node.type))
      if (node.namedChildCount == 2)
        return [this.codeGenerator.generate(node.namedChild(1))]
      else if (node.namedChild(0).type === 'identifier_pattern')
        return [undefined]
      else
        return []
    else
      return node.namedChildren
        .map(this.rec)
        .reduce((acc, value) => acc.concat(value), [])
  }
}
