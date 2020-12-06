import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import {
  BOOLEAN_TYPE,
  BuildType,
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ParametricType,
  REGULAR_EXPRESSION_TYPE,
  STRING_TYPE,
  TUPLE_TYPE,
  Type,
  TypeConstraint,
  TypeVariable,
} from '../../types'
import { CompileError, InternalError, TypeError } from '../../errors'
import { InferIdentifierPatternType } from './InferIdentifierPatternType'
import { InferListType } from './InferListType'
import { InferMapType } from './InferMapType'
import { InferPatternPairType } from './InferPatternPairType'
import { InferTupleType } from './InferTupleType'
import { InferTypes } from '../InferTypes'
import { NestedScope } from '../../symbol_table'
import Parser from 'tree-sitter'

export class InferPatternBindingTypes {
  private _inferTypes: InferTypes
  private _scope: NestedScope

  constructor(inferTypes: InferTypes, scope: NestedScope) {
    this._inferTypes = inferTypes
    this._scope = scope
  }

  perform = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type> = new TypeConstraint(
      new TypeVariable(),
    ),
  ): Disjunction<AST.Pattern> | undefined =>
    TypeError.safe(() =>
      CompileError.addContext(this.traverse, patternNode, typeConstraint),
    )

  // eslint-disable-next-line max-lines-per-function
  private traverse = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.Pattern> => {
    switch (patternNode.type) {
      case 'boolean':
        return this.handleBoolean(patternNode, typeConstraint)
      case 'identifier_pattern':
        return this.handleIdentifierPattern(patternNode, typeConstraint)
      case 'list_pattern':
        return this.handleListPattern(patternNode, typeConstraint)
      case 'map_pattern':
        return this.handleMapPattern(patternNode, typeConstraint)
      case 'number':
        return this.handleNumber(patternNode, typeConstraint)
      case 'pattern_pair':
        return this.handlePatternPair(patternNode, typeConstraint)
      case 'regex':
        return this.handleRegex(patternNode, typeConstraint)
      case 'rest_list':
        return this.handleRestList(patternNode, typeConstraint)
      case 'rest_map':
        return this.handleRestMap(patternNode, typeConstraint)
      case 'rest_tuple':
        return this.handleRestTuple(patternNode, typeConstraint)
      case 'shorthand_pair_identifier_pattern':
        return this.handleShorthandPairIdentifierPattern(
          patternNode,
          typeConstraint,
        )
      case 'string_pattern':
        return this.handleStringPattern(patternNode, typeConstraint)
      case 'parameters':
      case 'tuple_pattern':
        return this.handleTuplePattern(patternNode, typeConstraint)
      case 'type':
        return this.handleType(patternNode, typeConstraint)
      default:
        throw new InternalError(
          'Could not find matcher for AST pattern ' +
            `node '${patternNode.type}'.`,
        )
    }
  }

  private handleBoolean = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.Boolean> => {
    const unifiedTypeConstraint = new TypeConstraint(
      new ParametricType(BOOLEAN_TYPE),
    ).unify(typeConstraint)
    if (unifiedTypeConstraint === undefined) return new Disjunction([])

    return new Disjunction([
      new Answer(new AST.Boolean(patternNode.text), unifiedTypeConstraint),
    ])
  }

  private handleIdentifierPattern = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.IdentifierPattern> =>
    new InferIdentifierPatternType(
      this._inferTypes,
      this._scope,
      (name, transformedName, def) =>
        new AST.IdentifierPattern(name, transformedName, def),
    ).perform(patternNode, typeConstraint)

  private handleListPattern = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.ListPattern> => {
    const listType = new ParametricType(LIST_TYPE, [
      new TypeVariable(),
    ]).unsafeUnify(typeConstraint.type, typeConstraint.typeEqualityGraph)
    const elements = patternNode.namedChildren.map((elementNode) =>
      CompileError.addContext(
        this.traverse,
        elementNode,
        new TypeConstraint(
          listType.parameters[0],
          typeConstraint.typeEqualityGraph,
        ),
      ),
    )

    return new InferListType(
      (elements) => new AST.ListPattern(elements as AST.Pattern[]),
    ).perform(elements)
  }

  private handleMapPattern = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.MapPattern> => {
    const elements = patternNode.namedChildren.map((elementNode) =>
      CompileError.addContext(this.traverse, elementNode, typeConstraint),
    )

    return new InferMapType(
      (elements) => new AST.MapPattern(elements as AST.MapPatternElement[]),
    ).perform(elements)
  }

  private handleNumber = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.Number> => {
    const unifiedTypeConstraint = new TypeConstraint(
      new ParametricType(NUMBER_TYPE),
    ).unify(typeConstraint)
    if (unifiedTypeConstraint === undefined) return new Disjunction([])

    return new Disjunction([
      new Answer(new AST.Number(patternNode.text), unifiedTypeConstraint),
    ])
  }

  private handlePatternPair = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.PatternPair> => {
    const key = this._inferTypes.traverse(patternNode.namedChild(0)!)
    const value = CompileError.addContext(
      this.traverse,
      patternNode.namedChild(1)!,
      new TypeConstraint(new TypeVariable(), typeConstraint.typeEqualityGraph),
    )

    return new InferPatternPairType().perform(key, value, typeConstraint)
  }

  private handleRegex = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.Regex> => {
    const unifiedTypeConstraint = new TypeConstraint(
      new ParametricType(REGULAR_EXPRESSION_TYPE),
    ).unify(typeConstraint)
    if (unifiedTypeConstraint === undefined) return new Disjunction([])

    return new Disjunction([
      new Answer(new AST.Regex(patternNode.text), unifiedTypeConstraint),
    ])
  }

  private handleRestList = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.RestList> => {
    const value = CompileError.addContext(
      this.handleIdentifierPattern,
      patternNode.namedChild(0)!,
      new TypeConstraint(
        new ParametricType(LIST_TYPE, [typeConstraint.type]),
        typeConstraint.typeEqualityGraph,
      ),
    )

    return new Disjunction(
      value.answers.map(
        (answer) =>
          new Answer(new AST.RestList(answer.node), answer.typeConstraint),
      ),
    )
  }

  private handleRestMap = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.RestMap> => {
    const value = CompileError.addContext(
      this.handleIdentifierPattern,
      patternNode.namedChild(0)!,
      typeConstraint,
    )

    return new Disjunction(
      value.answers.map(
        (answer) =>
          new Answer(new AST.RestMap(answer.node), answer.typeConstraint),
      ),
    )
  }

  private handleRestTuple = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.RestTuple> => {
    const value = CompileError.addContext(
      this.handleIdentifierPattern,
      patternNode.namedChild(0)!,
      typeConstraint,
    )

    return new Disjunction(
      value.answers.map(
        (answer) =>
          new Answer(new AST.RestTuple(answer.node), answer.typeConstraint),
      ),
    )
  }

  private handleShorthandPairIdentifierPattern = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.ShorthandPairIdentifierPattern> =>
    new InferIdentifierPatternType(
      this._inferTypes,
      this._scope,
      (name, transformedName, def) =>
        new AST.ShorthandPairIdentifierPattern(name, transformedName, def),
      (type) =>
        new ParametricType(MAP_TYPE, [new ParametricType(STRING_TYPE), type]),
      (typeConstraint) =>
        new TypeConstraint(
          (typeConstraint.type as ParametricType).parameters[1],
          typeConstraint.typeEqualityGraph,
        ),
    ).perform(patternNode, typeConstraint)

  private handleStringPattern = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.StringPattern> => {
    const content = patternNode.text.slice(1, -1)
    const unifiedTypeConstraint = new TypeConstraint(
      new ParametricType(STRING_TYPE),
    ).unify(typeConstraint)
    if (unifiedTypeConstraint === undefined) return new Disjunction([])

    return new Disjunction([
      new Answer(new AST.StringPattern(content), unifiedTypeConstraint),
    ])
  }

  private handleTuplePattern = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.TuplePattern> => {
    const tupleType = new ParametricType(
      TUPLE_TYPE,
      [...Array(patternNode.namedChildCount)].map(() => new TypeVariable()),
    ).unsafeUnify(typeConstraint.type, typeConstraint.typeEqualityGraph)
    const elements = patternNode.namedChildren.map((elementNode, i) =>
      CompileError.addContext(
        this.traverse,
        elementNode,
        new TypeConstraint(
          tupleType.parameters[i],
          typeConstraint.typeEqualityGraph,
        ),
      ),
    )

    return new InferTupleType(
      (elements) => new AST.TuplePattern(elements as AST.Pattern[]),
    ).perform(elements)
  }

  private handleType = (
    patternNode: Parser.SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.ParametricType> => {
    const type = new BuildType().perform(patternNode)
    const unifiedTypeConstraint = new TypeConstraint(type).unify(typeConstraint)
    if (unifiedTypeConstraint === undefined) return new Disjunction([])

    return new Disjunction([
      new Answer(new AST.ParametricType(type.name), unifiedTypeConstraint),
    ])
  }
}
