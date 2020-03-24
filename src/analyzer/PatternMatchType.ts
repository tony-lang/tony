import Parser from 'tree-sitter'

import { Binding } from './SymbolTable'
import { TypeConstructor } from './types'

export class PatternMatchType {
  private bindings: Binding[] = []
  private isExported: boolean

  constructor(isExported = false) {
    this.isExported = isExported
  }

  perform = (pattern: Parser.SyntaxNode, type: TypeConstructor): Binding[] => {
    this.match(pattern, type)
    return this.bindings
  }

  match = (pattern: Parser.SyntaxNode, type: TypeConstructor): void => {
    switch (pattern.type) {
    // case 'boolean':
    //   return this.matchBoolean(pattern, type)
    case 'identifier_pattern':
      return this.matchIdentifier(pattern, type)
    // case 'list_pattern':
    //   return this.matchList(pattern, type)
    // case 'map_pattern':
    //   return this.matchMap(pattern, type)
    // case 'number':
    //   return this.matchNumber(pattern, type)
    // case 'pattern':
    //   return this.matchPattern(pattern, type)
    // case 'pattern_pair':
    //   return this.matchPatternPair(pattern, type)
    // case 'shorthand_pair_identifier_pattern':
    //   return this.matchShorthandPairIdentifierPattern(pattern, type)
    // case 'string_pattern':
    //   return this.matchStringPattern(pattern, type)
    // case 'tuple_pattern':
    //   return this.matchTuplePattern(pattern, type)
    // case 'type':
    //   return this.matchType(pattern, type)
    default:
      console.log(
        `Could not find generator for AST pattern node '${pattern.type}'.`
      )
      process.exit(1)
    }
  }

  matchIdentifier = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    const name = pattern.text

    this.bindings = [new Binding(name, type, this.isExported), ...this.bindings]
  }
}
