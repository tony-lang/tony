import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import { ParametricType, STRING_TYPE, TypeConstraint } from '../../types'

export class InferStringType {
  perform = (
    content: string,
    interpolationValues: Disjunction<AST.Expression>[],
  ): Disjunction<AST.String> => {
    const interpolations = this.handleInterpolations(interpolationValues)
    const string = new AST.String(
      content,
      interpolations.map((answer) => answer.node),
    )
    const typeConstraint = interpolations.reduce(
      (typeConstraint: TypeConstraint<ParametricType>, answer) =>
        typeConstraint.unify(answer.typeConstraint) as TypeConstraint<
          ParametricType
        >,
      new TypeConstraint(new ParametricType(STRING_TYPE)),
    )

    return new Disjunction([new Answer(string, typeConstraint)])
  }

  private handleInterpolations = (
    values: Disjunction<AST.Expression>[],
  ): Answer<AST.Interpolation>[] =>
    values.reduce(
      (interpolations: Answer<AST.Interpolation>[], value) => [
        ...interpolations,
        this.handleInterpolation(value).answers[0],
      ],
      [],
    )

  private handleInterpolation = (
    value: Disjunction<AST.Expression>,
  ): Disjunction<AST.Interpolation> =>
    new Disjunction(
      value.answers.reduce((answers: Answer<AST.Interpolation>[], answer) => {
        const typeConstraint = new TypeConstraint(
          new ParametricType(STRING_TYPE),
        ).unify(answer.typeConstraint)
        if (typeConstraint === undefined) return answers

        return [
          ...answers,
          new Answer(new AST.Interpolation(answer.node), typeConstraint),
        ]
      }, []),
    )
}
