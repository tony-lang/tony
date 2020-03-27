import Parser from 'tree-sitter'

import { ErrorHandler } from '../ErrorHandler'
import { TypeConstructor, MapType, ObjectType } from '../types'

import { Binding } from './SymbolTable'

export class PatternMatchType {
  private bindings: Binding[] = []
  private isExported: boolean
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(
    errorHandler: ErrorHandler,
    node: Parser.SyntaxNode,
    isExported = false
  ) {
    this.errorHandler = errorHandler
    this.node = node
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
      return this.matchIdentifierPattern(pattern, type)
    // case 'list_pattern':
    //   return this.matchListPattern(pattern, type)
    case 'map_pattern':
      return this.matchMapPattern(pattern, type)
    // case 'number':
    //   return this.matchNumber(pattern, type)
    case 'pattern':
      return this.matchPattern(pattern, type)
    case 'pattern_pair':
      return this.matchPatternPair(pattern, type)
    case 'shorthand_pair_identifier_pattern':
      return this.matchShorthandPairIdentifierPattern(pattern, type)
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

  matchIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    const name = pattern.text

    this.bindings = [new Binding(name, type, this.isExported), ...this.bindings]
  }

  matchMapPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    pattern.namedChildren.map(child => this.match(child, type))
  }

  matchPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => this.match(pattern.namedChild(0), type)

  matchPatternPair = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    if (type.length != 1) this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against map',
      this.node
    )

    const identifierPatternName = pattern.namedChild(0)
    const nestedPattern = pattern.namedChild(1)

    const atomicType = type.types[0]
    if (atomicType instanceof MapType)
      this.match(nestedPattern, atomicType.valueType)
    else if (atomicType instanceof ObjectType)
      this.match(
        nestedPattern,
        atomicType.propertyTypes.get(identifierPatternName.text)
      )
    else this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against map',
      this.node
    )
  }

  matchShorthandPairIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    if (type.length != 1) this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against map',
      this.node
    )

    const identifierPattern = pattern.namedChild(0)
    const identifierPatternName = identifierPattern.namedChild(0)

    const atomicType = type.types[0]
    if (atomicType instanceof MapType)
      this.match(identifierPattern, atomicType.valueType)
    else if (atomicType instanceof ObjectType)
      this.match(
        identifierPattern,
        atomicType.propertyTypes.get(identifierPatternName.text)
      )
    else this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against map',
      this.node
    )
  }
}
