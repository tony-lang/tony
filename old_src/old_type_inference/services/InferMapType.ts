import * as AST from '../../ast'
import { AccumulatedAnswer, Answer, Disjunction } from '../models'
import {
  MAP_TYPE,
  ParametricType,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
  TypeVariable,
} from '../../types'
import { DistributeTypeDisjunction } from './DistributeTypeDisjunction'

type Factory<T> = (elements: AST.SyntaxNode[]) => T

export class InferMapType<T extends AST.SyntaxNode> {
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
            new ParametricType(MAP_TYPE, [
              new TypeVariable(),
              new TypeVariable(),
            ]),
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

      return type.unify(answer.typeConstraint.type, typeEqualityGraph)
    }, new ParametricType(MAP_TYPE, [new TypeVariable(), new TypeVariable()]))
}
