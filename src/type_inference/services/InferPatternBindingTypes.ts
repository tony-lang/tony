import {
  BOOLEAN_TYPE,
  BuildType,
  CurriedType,
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ParametricType,
  REGULAR_EXPRESSION_TYPE,
  STRING_TYPE,
  TUPLE_TYPE,
  Type,
  TypeConstraints,
  TypeVariable,
} from '../../types'
import { CompileError, InternalError, TypeError, assert } from '../../errors'
import { IdentifierBinding, NestedScope } from '../../symbol_table'
import { InferListType } from './InferListType'
import { InferMapType } from './InferMapType'
import { InferTypes } from '../InferTypes'
import Parser from 'tree-sitter'

export class InferPatternBindingTypes {
  private _inferTypes: InferTypes
  private _scope: NestedScope
  private _typeConstraints: TypeConstraints

  constructor(
    inferTypes: InferTypes,
    scope: NestedScope,
    typeConstraints: TypeConstraints,
  ) {
    this._inferTypes = inferTypes
    this._scope = scope
    this._typeConstraints = typeConstraints
  }

  perform = (patternNode: Parser.SyntaxNode, type: Type): Type => {
    const patternType = this.traverse(patternNode, type)

    assert(patternType !== undefined, 'Should not be undefined.')

    return patternType
  }

  performParameters = (patternNode: Parser.SyntaxNode): CurriedType => {
    assert(patternNode.type === 'parameters', 'Should be `parameters` type.')

    return new CurriedType(
      patternNode.namedChildren.map((child) =>
        this.perform(child, new TypeVariable()),
      ),
    )
  }

  // eslint-disable-next-line max-lines-per-function
  private traverse = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): Type | undefined => {
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
  ): ParametricType =>
    new ParametricType(BOOLEAN_TYPE).unify(type, this._typeConstraints)

  private handleIdentifierPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): Type => {
    const name = patternNode.namedChild(0)!.text
    const binding = this._scope.resolveBinding(name, 0)

    assert(
      binding instanceof IdentifierBinding,
      'Pattern identifier binding should be found in current scope.',
    )

    binding.type = binding.type.unify(type, this._typeConstraints)

    return binding.type
  }

  private handleListPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType => {
    const unifiedType = new ParametricType(LIST_TYPE, [
      new TypeVariable(),
    ]).unify(type, this._typeConstraints)
    const valueTypes = patternNode.namedChildren.map((child) =>
      this.perform(child, unifiedType.parameters[0]),
    )

    return new InferListType(this._typeConstraints).perform(valueTypes)
  }

  private handleMapPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType => {
    const mapTypes = patternNode.namedChildren.map((child) =>
      this.perform(child, type),
    )

    return new InferMapType(this._typeConstraints).perform(mapTypes)
  }

  private handleNumber = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType =>
    new ParametricType(NUMBER_TYPE).unify(type, this._typeConstraints)

  private handlePattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): Type => {
    if (patternNode.namedChildCount == 1)
      return this.perform(patternNode.namedChild(0)!, type)

    const defaultType = this._inferTypes.traverse(patternNode.namedChild(1)!)!

    return this.perform(
      patternNode.namedChild(0)!,
      type.unify(defaultType, this._typeConstraints),
    )
  }

  private handlePatternPair = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): Type => {
    const keyType = this._inferTypes.traverse(patternNode.namedChild(0)!)!
    const unifiedType = new ParametricType(MAP_TYPE, [
      keyType,
      new TypeVariable(),
    ]).unify(type, this._typeConstraints)
    const valueType = this.perform(
      patternNode.namedChild(1)!,
      unifiedType.parameters[1],
    )

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private handleRegex = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType =>
    new ParametricType(REGULAR_EXPRESSION_TYPE).unify(
      type,
      this._typeConstraints,
    )

  private handleRestList = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): Type => {
    const valueType = this.perform(
      patternNode.namedChild(0)!,
      new ParametricType(LIST_TYPE, [type]),
    )

    assert(valueType instanceof ParametricType, 'Should be parametric type.')

    return valueType.parameters[0]
  }

  private handleRestMap = (patternNode: Parser.SyntaxNode, type: Type): Type =>
    this.perform(patternNode.namedChild(0)!, type)

  private handleShorthandPairIdentifierPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType => {
    const keyType = new ParametricType(STRING_TYPE)
    const valueType =
      patternNode.namedChildCount == 2
        ? this._inferTypes.traverse(patternNode.namedChild(1)!)!
        : new TypeVariable()
    const unifiedType = new ParametricType(MAP_TYPE, [
      keyType,
      valueType,
    ]).unify(type, this._typeConstraints)
    const unifiedValueType = this.perform(
      patternNode.namedChild(0)!,
      unifiedType.parameters[1],
    )

    return new ParametricType(MAP_TYPE, [keyType, unifiedValueType])
  }

  private handleStringPattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType =>
    new ParametricType(STRING_TYPE).unify(type, this._typeConstraints)

  private handleTuplePattern = (
    patternNode: Parser.SyntaxNode,
    type: Type,
  ): ParametricType => {
    if (type instanceof ParametricType && type.name === TUPLE_TYPE)
      return new ParametricType(
        TUPLE_TYPE,
        patternNode.namedChildren.map((child, i) =>
          this.perform(child, type.parameters[i]),
        ),
      )

    throw new TypeError(
      type,
      undefined,
      'Only values of a tuple type may be pattern matched against a tuple.',
    )
  }

  private handleType = (patternNode: Parser.SyntaxNode, type: Type): Type =>
    new BuildType().handleType(patternNode).unify(type, this._typeConstraints)
}
