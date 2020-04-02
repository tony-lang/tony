import {
  CurriedType,
  LIST_TYPE,
  MAP_TYPE,
  ParametricType,
  TUPLE_TYPE,
  Type,
  TypeConstraints,
  TypeVariable,
} from '../types'
import { InternalError, TypeError, assert } from '../../errors'
import { Binding } from './Binding'
import Parser from 'tree-sitter'

export class ResolvePatternBindings {
  private bindings: Binding[] = []
  private isExported: boolean
  private isImplicit: boolean
  private typeConstraints: TypeConstraints

  constructor(
    typeConstraints: TypeConstraints,
    isImplicit = false,
    isExported = false,
  ) {
    this.typeConstraints = typeConstraints
    this.isImplicit = isImplicit
    this.isExported = isExported
  }

  perform = (pattern: Parser.SyntaxNode, type: Type): Binding[] => {
    this.match(pattern, type)
    return this.bindings
  }

  private match = (pattern: Parser.SyntaxNode, type: Type): void => {
    switch (pattern.type) {
      case 'identifier_pattern':
        return this.matchIdentifierPattern(pattern, type)
      case 'list_pattern':
        return this.matchListPattern(pattern, type)
      case 'map_pattern':
        return this.matchMapPattern(pattern, type)
      case 'number':
        return
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
      case 'rest_tuple':
        return this.matchRestList(pattern, type)
      case 'shorthand_pair_identifier_pattern':
        return this.matchShorthandPairIdentifierPattern(pattern, type)
      case 'tuple_pattern':
        return this.matchTuplePattern(pattern, type)
      default:
        throw new InternalError(
          'ResolvePatternBindings: Could not find matcher for AST pattern ' +
            `node '${pattern.type}'.`,
        )
    }
  }

  private matchIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    const identifierPatternName = pattern.namedChild(0)!
    const name = identifierPatternName.text

    this.bindings = [
      new Binding(name, type, this.isImplicit, this.isExported),
      ...this.bindings,
    ]
  }

  private matchListPattern = (pattern: Parser.SyntaxNode, type: Type): void => {
    const unifiedType = new ParametricType(LIST_TYPE, [
      new TypeVariable(),
    ]).unify(type, this.typeConstraints)

    pattern.namedChildren.forEach((child) =>
      this.match(child, unifiedType.parameters[0]),
    )
  }

  private matchMapPattern = (pattern: Parser.SyntaxNode, type: Type): void =>
    pattern.namedChildren.forEach((child) => this.match(child, type))

  private matchParameters = (pattern: Parser.SyntaxNode, type: Type): void => {
    assert(
      type instanceof CurriedType,
      'Parameters are expected to be curried.',
    )

    pattern.namedChildren.forEach((child, i) => {
      this.match(child, type.parameters[i])
    })
  }

  private matchPattern = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.match(pattern.namedChild(0)!, type)

  private matchPatternPair = (pattern: Parser.SyntaxNode, type: Type): void => {
    const unifiedType = new ParametricType(MAP_TYPE, [
      new TypeVariable(),
      new TypeVariable(),
    ]).unify(type, this.typeConstraints)

    return this.match(pattern.namedChild(1)!, unifiedType.parameters[1])
  }

  private matchRestList = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.match(pattern.namedChild(0)!, new ParametricType(LIST_TYPE, [type]))

  private matchRestMap = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.match(pattern.namedChild(0)!, type)

  private matchRestTuple = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.match(pattern.namedChild(0)!, type)

  private matchShorthandPairIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    const unifiedType = new ParametricType(MAP_TYPE, [
      new TypeVariable(),
      new TypeVariable(),
    ]).unify(type, this.typeConstraints)

    return this.match(pattern.namedChild(0)!, unifiedType.parameters[1])
  }

  private matchTuplePattern = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    if (type instanceof ParametricType && type.name === TUPLE_TYPE)
      return pattern.namedChildren.forEach((child, i) => {
        this.match(child, type.parameters[i])
      })

    throw new TypeError(
      type,
      undefined,
      'Only values of a tuple type may be pattern matched against a tuple.',
    )
  }
}
