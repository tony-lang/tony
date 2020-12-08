import * as AST from '../../ast'
import { AccumulatedAnswer, Answer, Disjunction } from '../models'
import {
  LIST_TYPE,
  ParametricType,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
  TypeVariable,
} from '../../types'
import { DistributeTypeDisjunction } from './DistributeTypeDisjunction'

type Factory<T> = (elements: AST.SyntaxNode[]) => T

export class InferListType<T extends AST.SyntaxNode> {
  private _factory: Factory<T>

  constructor(factory: Factory<T>) {
    this._factory = factory
  }

  perform = (elements: Disjunction<AST.SyntaxNode>[]): Disjunction<T> => {
    const answers = this.inferAnswers(elements)
    if (answers.length == 0)
      return new Disjunction([
        new Answer(
          this._factory([]),
          new TypeConstraint(
            new ParametricType(LIST_TYPE, [new TypeVariable()]),
          ),
        ),
      ])

    return new Disjunction(answers)
  }

  private inferAnswers = (
    elements: Disjunction<AST.SyntaxNode>[],
  ): (Answer<T> | undefined)[] =>
    new DistributeTypeDisjunction().perform(elements).map((elements) => {
      const typeEqualityGraph = TypeEqualityGraph.build(
        ...elements.typeConstraints.map(
          (typeConstraint) => typeConstraint.typeEqualityGraph,
        ),
      )
      if (typeEqualityGraph === undefined) return
      const type = this.inferType(elements, typeEqualityGraph)
      if (type === undefined) return

      return new Answer(
        this._factory(elements.nodes),
        new TypeConstraint(type, typeEqualityGraph),
      )
    })

  private inferType = (
    elements: AccumulatedAnswer<AST.SyntaxNode>,
    typeEqualityGraph: TypeEqualityGraph,
  ): Type | undefined =>
    elements.answers.reduce((type: Type | undefined, answer) => {
      if (type === undefined) return

      if (
        answer.node instanceof AST.RestList ||
        answer.node instanceof AST.SpreadList
      )
        this.handleSpread(type, answer, typeEqualityGraph)

      return type.unify(
        new ParametricType(LIST_TYPE, [answer.typeConstraint.type]),
        typeEqualityGraph,
      )
    }, new ParametricType(LIST_TYPE, [new TypeVariable()]))

  private handleSpread = (
    type: Type,
    answer: Answer<AST.SyntaxNode>,
    typeEqualityGraph: TypeEqualityGraph,
  ): Type | undefined => {
    const spreadType = new ParametricType(LIST_TYPE, [
      new TypeVariable(),
    ]).unify(answer.typeConstraint.type, typeEqualityGraph)
    if (spreadType === undefined) return

    return type.unify(spreadType, typeEqualityGraph)
  }
}
