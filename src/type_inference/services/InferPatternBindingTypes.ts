import Parser from 'tree-sitter'
import {
  TypeConstraints,
  Type,
  ParametricType,
  BOOLEAN_TYPE,
  LIST_TYPE,
  TypeVariable,
  CurriedType,
  MAP_TYPE,
  TUPLE_TYPE,
  NUMBER_TYPE,
  REGULAR_EXPRESSION_TYPE,
  STRING_TYPE,
  BuildType,
} from '../../types'
import { NestedScope, IdentifierBinding } from '../../symbol_table'
import { CompileError, InternalError, assert, TypeError } from '../../errors'

export class InferPatternBindingTypes {
  private _scope: NestedScope
  private _typeConstraints: TypeConstraints

  constructor(scope: NestedScope, typeConstraints: TypeConstraints) {
    this._scope = scope
    this._typeConstraints = typeConstraints
  }

  perform = (patternNode: Parser.SyntaxNode, type: Type): void => {
    try {
      switch (patternNode.type) {
        case 'boolean':
          return this.handleBoolean(patternNode, type)
        case 'comment':
          return
        case 'identifier_pattern':
          return this.handleIdentifierPattern(patternNode, type)
        case 'list_pattern':
          return this.handleListPattern(patternNode, type)
        case 'map_pattern':
          return this.handleMapPattern(patternNode, type)
        case 'number':
          return this.handleNumber(patternNode, type)
        case 'parameters':
          return this.handleParameters(patternNode, type)
        case 'pattern':
          return this.handlePattern(patternNode, type)
        case 'pattern_pair':
          return this.handlePatternPair(patternNode, type)
        case 'regex':
          return this.handleRegex(patternNode, type)
        case 'rest_list':
          return this.handleRestList(patternNode, type)
        case 'rest_map':
          return this.handleRestMap(patternNode, type)
        case 'rest_tuple':
          return this.handleRestList(patternNode, type)
        case 'shorthand_pair_identifier_pattern':
          return this.handleShorthandPairIdentifierPattern(patternNode, type)
        case 'string_pattern':
          return this.handleStringPattern(patternNode, type)
        case 'tuple_pattern':
          return this.handleTuplePattern(patternNode, type)
        case 'type':
          return this.handleType(patternNode, type)
        default:
          throw new InternalError(
            'InferPatternBindingTypes: Could not find matcher for AST pattern ' +
              `node '${patternNode.type}'.`,
          )
      }
    } catch (error) {
      if (error instanceof CompileError && error.context === undefined)
        error.addContext(patternNode)
      throw error
    }
  }

  private handleBoolean = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): void => {
    new ParametricType(BOOLEAN_TYPE).unify(type, this._typeConstraints)
  }

  private handleIdentifierPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): void => {
    const name = patternNode.namedChild(0)!.text
    const binding = this._scope.resolveBinding(name, 0)

    assert(
      binding instanceof IdentifierBinding,
      'Pattern identifier binding should be found in current scope.',
    )

    binding.type = binding.type.unify(type, this._typeConstraints)
  }

  private handleListPattern = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    const unifiedType = new ParametricType(LIST_TYPE, [
      new TypeVariable(),
    ]).unify(type, this._typeConstraints)

    pattern.namedChildren.forEach((child) =>
      this.perform(child, unifiedType.parameters[0]),
    )
  }

  private handleMapPattern = (pattern: Parser.SyntaxNode, type: Type): void =>
    pattern.namedChildren.forEach((child) => this.perform(child, type))

  private handleNumber = (patternNode: Parser.SyntaxNode, type: Type): void => {
    new ParametricType(NUMBER_TYPE).unify(type, this._typeConstraints)
  }

  private handleParameters = (pattern: Parser.SyntaxNode, type: Type): void => {
    assert(
      type instanceof CurriedType,
      'Parameters are expected to be curried.',
    )

    pattern.namedChildren.forEach((child, i) => {
      this.perform(child, type.parameters[i])
    })
  }

  private handlePattern = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.perform(pattern.namedChild(0)!, type)

  private handlePatternPair = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    const unifiedType = new ParametricType(MAP_TYPE, [
      new TypeVariable(),
      new TypeVariable(),
    ]).unify(type, this._typeConstraints)

    this.perform(pattern.namedChild(1)!, unifiedType.parameters[1])
  }

  private handleRegex = (patternNode: Parser.SyntaxNode, type: Type): void => {
    new ParametricType(REGULAR_EXPRESSION_TYPE).unify(
      type,
      this._typeConstraints,
    )
  }

  private handleRestList = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.perform(pattern.namedChild(0)!, new ParametricType(LIST_TYPE, [type]))

  private handleRestMap = (pattern: Parser.SyntaxNode, type: Type): void =>
    this.perform(pattern.namedChild(0)!, type)

  private handleShorthandPairIdentifierPattern = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    const unifiedType = new ParametricType(MAP_TYPE, [
      new TypeVariable(),
      new TypeVariable(),
    ]).unify(type, this._typeConstraints)

    return this.perform(pattern.namedChild(0)!, unifiedType.parameters[1])
  }

  private handleStringPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): void => {
    new ParametricType(STRING_TYPE).unify(type, this._typeConstraints)
  }

  private handleTuplePattern = (
    pattern: Parser.SyntaxNode,
    type: Type,
  ): void => {
    if (type instanceof ParametricType && type.name === TUPLE_TYPE)
      return pattern.namedChildren.forEach((child, i) => {
        this.perform(child, type.parameters[i])
      })

    throw new TypeError(
      type,
      undefined,
      'Only values of a tuple type may be pattern matched against a tuple.',
    )
  }

  private handleType = (patternNode: Parser.SyntaxNode, type: Type): void => {
    new BuildType().handleType(patternNode).unify(type, this._typeConstraints)
  }
}
