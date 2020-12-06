import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import {
  MAP_TYPE,
  ParametricType,
  TypeConstraint,
  TypeEqualityGraph,
} from '../../types'
import { MergeTypeDisjunction } from './MergeTypeDisjunction'

export class InferExpressionPairType {
  perform = (
    key: Disjunction<AST.Expression>,
    value: Disjunction<AST.Expression>,
  ): Disjunction<AST.ExpressionPair> =>
    new MergeTypeDisjunction<
      AST.Expression,
      AST.Expression,
      AST.ExpressionPair
    >(this.buildAnswer).perform(key, value)

  private buildAnswer = (
    key: Answer<AST.Expression>,
    value: Answer<AST.Expression>,
  ): Answer<AST.ExpressionPair> | undefined => {
    const typeEqualityGraph = TypeEqualityGraph.build(
      key.typeConstraint.typeEqualityGraph,
      value.typeConstraint.typeEqualityGraph,
    )
    if (typeEqualityGraph === undefined) return

    return new Answer(
      new AST.ExpressionPair(key.node, value.node),
      new TypeConstraint(
        new ParametricType(MAP_TYPE, [
          key.typeConstraint.type,
          value.typeConstraint.type,
        ]),
        typeEqualityGraph,
      ),
    )
  }
}
