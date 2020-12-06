import * as AST from '../../ast'
import { AccumulatedAnswer, Answer, Disjunction } from '../models'
import { TypeConstraint, TypeEqualityGraph } from '../../types'
import { DistributeTypeDisjunction } from './DistributeTypeDisjunction'

type Factory<T> = (expressions: AccumulatedAnswer<AST.Expression>) => T

export class InferBlockType<T extends AST.SyntaxNode> {
  private _factory: Factory<T>

  constructor(factory: Factory<T>) {
    this._factory = factory
  }

  perform = (expressions: Disjunction<AST.Expression>[]): Disjunction<T> =>
    new Disjunction(
      new DistributeTypeDisjunction<AST.Expression>()
        .perform(expressions)
        .map(this.buildBlock),
    )

  private buildBlock = (
    expressions: AccumulatedAnswer<AST.Expression>,
  ): Answer<T> | undefined => {
    const typeEqualityGraph = TypeEqualityGraph.build(
      ...expressions.typeConstraints.map(
        (typeConstraint) => typeConstraint.typeEqualityGraph,
      ),
    )
    if (typeEqualityGraph === undefined) return

    return new Answer(
      this._factory(expressions),
      new TypeConstraint(
        expressions.answers[expressions.answers.length - 1].typeConstraint.type,
        typeEqualityGraph,
      ),
    )
  }
}
