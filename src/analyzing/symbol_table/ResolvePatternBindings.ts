import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'
import { assert } from '../../utilities'

import {
  CurriedTypeConstructor,
  ListType,
  MapType,
  ObjectType,
  SingleTypeConstructor,
  TupleType,
  TypeConstructor
} from '../types'

import { Binding } from './Binding'

export class ResolvePatternBindings {
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
    case 'list_pattern':
      return this.matchListPattern(pattern, type)
    case 'map_pattern':
      return this.matchMapPattern(pattern, type)
    // case 'number':
    //   return this.matchNumber(pattern, type)
    case 'parameters':
      return this.matchParameters(pattern, type)
    case 'pattern':
      return this.matchPattern(pattern, type)
    case 'pattern_pair':
      return this.matchPatternPair(pattern, type)
    case 'rest_list':
      return this.matchRestList(pattern, type)
    case 'rest_map':
      return this.matchRestMap(pattern, type)
    case 'shorthand_pair_identifier_pattern':
      return this.matchShorthandPairIdentifierPattern(pattern, type)
    // case 'string_pattern':
    //   return this.matchStringPattern(pattern, type)
    case 'tuple_pattern':
      return this.matchTuplePattern(pattern, type)
    // case 'type':
    //   return this.matchType(pattern, type)
    default:
      console.log(
        `Could not find matcher for AST pattern node '${pattern.type}'.`
      )
      process.exit(1)
    }
  }

  matchIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    const identifierPatternName = pattern.namedChild(0)
    const name = identifierPatternName.text

    this.bindings = [new Binding(name, type, this.isExported), ...this.bindings]
  }

  matchListPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    if (type instanceof SingleTypeConstructor && type.type instanceof ListType)
      pattern.namedChildren
        .forEach(child => this.match(child, (type.type as ListType).type))
    else this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against list',
      this.node
    )
  }

  matchMapPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => pattern.namedChildren.forEach(child => this.match(child, type))

  matchParameters = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    assert(
      type instanceof CurriedTypeConstructor,
      'Parameters must be curried'
    )

    pattern.namedChildren.forEach((child, i) => {
      this.match(child, type.types[i])
    })
  }

  matchPattern = (pattern: Parser.SyntaxNode, type: TypeConstructor): void =>
    this.match(pattern.namedChild(0), type)

  matchPatternPair = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    if (type instanceof SingleTypeConstructor) {
      const identifierPatternName = pattern.namedChild(0)
      const nestedPattern = pattern.namedChild(1)
      const atomicType = type.type

      if (atomicType instanceof MapType)
        return this.match(nestedPattern, atomicType.valueType)
      else if (atomicType instanceof ObjectType)
        return this.match(
          nestedPattern,
          atomicType.propertyTypes.get(identifierPatternName.text)
        )
    }

    this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against map',
      this.node
    )
  }

  matchRestList = (pattern: Parser.SyntaxNode, type: TypeConstructor): void =>
    this.match(
      pattern.namedChild(0),
      new SingleTypeConstructor(new ListType(type))
    )

  matchRestMap = (pattern: Parser.SyntaxNode, type: TypeConstructor): void =>
    this.match(pattern.namedChild(0), type)

  matchShorthandPairIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    if (type instanceof SingleTypeConstructor) {
      const identifierPattern = pattern.namedChild(0)
      const identifierPatternName = identifierPattern.namedChild(0)
      const atomicType = type.type

      if (atomicType instanceof MapType)
        return this.match(identifierPattern, atomicType.valueType)
      else if (atomicType instanceof ObjectType)
        return this.match(
          identifierPattern,
          atomicType.propertyTypes.get(identifierPatternName.text)
        )
    }

    this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against map',
      this.node
    )
  }

  matchTuplePattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    if (type instanceof SingleTypeConstructor && type.type instanceof TupleType)
      pattern.namedChildren.forEach((child, i) => {
        this.match(child, (type.type as TupleType).types[i])
      })
    else this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be pattern matched ` +
      'against tuple',
      this.node
    )
  }
}
