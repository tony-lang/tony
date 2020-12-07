import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import {
  MAP_TYPE,
  ParametricType,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
} from '../../types'

export class InferPatternPairType {
  perform = (
    key: Disjunction<AST.SyntaxNode>,
    value: Disjunction<AST.Pattern>,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<AST.PatternPair> =>
    new Disjunction(
      key.answers
        .map((keyAnswer) =>
          value.answers.map((valueAnswer) =>
            this.buildAnswer(keyAnswer, valueAnswer, typeConstraint),
          ),
        )
        .flat(1),
    )

  private buildAnswer = (
    key: Answer<AST.SyntaxNode>,
    value: Answer<AST.Pattern>,
    typeConstraint: TypeConstraint<Type>,
  ): Answer<AST.PatternPair> | undefined => {
    const unifiedTypeConstraint = this.unifyTypeConstraints(
      key.typeConstraint,
      value.typeConstraint,
      typeConstraint,
    )
    if (unifiedTypeConstraint === undefined) return

    return new Answer(
      new AST.PatternPair(key.node, value.node),
      unifiedTypeConstraint,
    )
  }

  private unifyTypeConstraints = (
    key: TypeConstraint<Type>,
    value: TypeConstraint<Type>,
    typeConstraint: TypeConstraint<Type>,
  ): TypeConstraint<Type> | undefined => {
    const typeEqualityGraph = TypeEqualityGraph.build(
      key.typeEqualityGraph,
      value.typeEqualityGraph,
    )
    if (typeEqualityGraph === undefined) return

    return new TypeConstraint(
      new ParametricType(MAP_TYPE, [key.type, value.type]),
      typeEqualityGraph,
    ).unify(typeConstraint)
  }
}
