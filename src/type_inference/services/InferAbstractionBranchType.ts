import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import {
  FUNCTION_TYPE,
  ParametricType,
  TypeConstraint,
  TypeEqualityGraph,
} from '../../types'
import { MergeTypeDisjunction } from './MergeTypeDisjunction'
import { assert } from '../../errors'

export class InferAbstractionBranchType<T> {
  perform = (
    parameters: Disjunction<AST.Parameters>,
    body: Disjunction<AST.Block>,
  ): Disjunction<AST.AbstractionBranch> =>
    new MergeTypeDisjunction<AST.Parameters, AST.Block, AST.AbstractionBranch>(
      (parametersAnswer, bodyAnswer) => {
        const typeEqualityGraph = TypeEqualityGraph.build(
          parametersAnswer.typeConstraint.typeEqualityGraph,
          bodyAnswer.typeConstraint.typeEqualityGraph,
        )
        if (typeEqualityGraph === undefined) return

        return this.buildAnswer(parametersAnswer, bodyAnswer, typeEqualityGraph)
      },
    ).perform(parameters, body)

  private buildAnswer = (
    parametersAnswer: Answer<AST.Parameters>,
    bodyAnswer: Answer<AST.Block>,
    typeEqualityGraph: TypeEqualityGraph,
  ): Answer<AST.AbstractionBranch> => {
    assert(
      parametersAnswer.typeConstraint.type instanceof ParametricType,
      'Parameter types should be a parametric function type.',
    )

    return new Answer(
      new AST.AbstractionBranch(parametersAnswer.node, bodyAnswer.node),
      new TypeConstraint(
        new ParametricType(FUNCTION_TYPE, [
          ...parametersAnswer.typeConstraint.type.parameters,
          bodyAnswer.typeConstraint.type,
        ]),
        typeEqualityGraph,
      ),
    )
  }
}
