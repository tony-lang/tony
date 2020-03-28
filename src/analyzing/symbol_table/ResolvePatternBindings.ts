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
  private isImplicit: boolean
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(
    errorHandler: ErrorHandler,
    node: Parser.SyntaxNode,
    isImplicit = false,
    isExported = false
  ) {
    this.errorHandler = errorHandler
    this.node = node
    this.isImplicit = isImplicit
    this.isExported = isExported
  }

  perform = (pattern: Parser.SyntaxNode, type: TypeConstructor): Binding[] => {
    this.match(pattern, type)
    return this.bindings
  }

  private match = (pattern: Parser.SyntaxNode, type: TypeConstructor): void => {
    switch (pattern.type) {
    case 'identifier_pattern':
      return this.matchIdentifierPattern(pattern, type)
    case 'list_pattern':
      return this.matchListPattern(pattern, type)
    case 'map_pattern':
      return this.matchMapPattern(pattern, type)
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
    case 'tuple_pattern':
      return this.matchTuplePattern(pattern, type)
    default:
      assert(
        false,
        `Could not find matcher for AST pattern node '${pattern.type}'.`
      )
    }
  }

  private matchIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    const identifierPatternName = pattern.namedChild(0)
    const name = identifierPatternName.text

    this.bindings = [
      new Binding(name, type, this.isImplicit, this.isExported),
      ...this.bindings
    ]
  }

  private matchListPattern = (
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

  private matchMapPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => pattern.namedChildren.forEach(child => this.match(child, type))

  private matchParameters = (
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

  private matchPattern = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => this.match(pattern.namedChild(0), type)

  private matchPatternPair = (
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

  private matchRestList = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => {
    // returns new list type with `isRest == false`
    if (type instanceof SingleTypeConstructor && type.type instanceof ListType)
      this.match(
        pattern.namedChild(0),
        new SingleTypeConstructor(new ListType(type.type.type))
      )
    else this.errorHandler.throw(
      `Values of type '${type.toString()}' cannot be used with the rest list ` +
      'operator',
      this.node
    )
  }

  private matchRestMap = (
    pattern: Parser.SyntaxNode,
    type: TypeConstructor
  ): void => this.match(pattern.namedChild(0), type)

  private matchShorthandPairIdentifierPattern = (
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

  private matchTuplePattern = (
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
