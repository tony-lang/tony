import * as AST from '../../ast'
import { AccumulatedAnswer, Answer, Disjunction } from '../models'
import {
  ParametricType,
  TUPLE_TYPE,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
} from '../../types'
import { DistributeTypeDisjunction } from './DistributeTypeDisjunction'

type Factory<T> = (elements: AST.SyntaxNode[]) => T

export class InferTupleType<T extends AST.SyntaxNode> {
  private _factory: Factory<T>

  constructor(factory: Factory<T>) {
    this._factory = factory
  }

  perform = (elements: Disjunction<AST.SyntaxNode>[]): Disjunction<T> =>
    new Disjunction(
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
      }),
    )

  private inferType = (
    elements: AccumulatedAnswer<AST.SyntaxNode>,
    typeEqualityGraph: TypeEqualityGraph,
  ): ParametricType | undefined => {
    const parameterTypes = elements.answers.reduce(
      (parameters: Type[] | undefined, answer) => {
        if (parameters === undefined) return
        if (
          answer.node instanceof AST.RestTuple ||
          answer.node instanceof AST.SpreadTuple
        )
          return this.handleSpread(parameters, answer, typeEqualityGraph)

        return [...parameters, answer.typeConstraint.type]
      },
      [],
    )
    if (parameterTypes === undefined) return

    return new ParametricType(TUPLE_TYPE, parameterTypes)
  }

  private handleSpread = (
    parameters: Type[],
    answer: Answer<AST.SyntaxNode>,
    typeEqualityGraph: TypeEqualityGraph,
  ): Type[] | undefined => {
    const spreadType = new ParametricType(TUPLE_TYPE, []).unify(
      answer.typeConstraint.type,
      typeEqualityGraph,
      true,
    )
    if (!(spreadType instanceof ParametricType)) return

    return [...parameters, ...spreadType.parameters]
  }
}
