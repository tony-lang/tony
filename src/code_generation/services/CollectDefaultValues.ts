import { GenerateCode } from '../GenerateCode'
import { NODE_TYPES_WITH_DEFAULT_VALUES } from '../../constants'
import Parser from 'tree-sitter'

export class CollectDefaultValues {
  private codeGenerator: GenerateCode

  constructor(codeGenerator: GenerateCode) {
    this.codeGenerator = codeGenerator
  }

  perform = (node: Parser.SyntaxNode): string => `[${this.rec(node).join(',')}]`

  rec = (node: Parser.SyntaxNode): (string | undefined)[] => {
    // prettier-ignore
    if (NODE_TYPES_WITH_DEFAULT_VALUES.includes(node.type))
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      if (node.defaultNode) return [this.codeGenerator.traverse(node.defaultNode)]
      else return [undefined]
    else
      return node.namedChildren
        .map(this.rec)
        .reduce((acc, value) => acc.concat(value), [])
  }
}
