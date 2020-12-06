import * as AST from '../../ast'
import {
  AccumulatedAnswer,
  AccumulatedDisjunction,
  Answer,
  GeneralizedDisjunction,
  getAnswers,
} from '../models'

export class DistributeTypeDisjunction<T extends AST.SyntaxNode> {
  perform = ([disjunction, ...otherDisjunctions]: GeneralizedDisjunction<
    T
  >[]): AccumulatedDisjunction<T> => {
    if (disjunction === undefined) return []

    const distributedAnswers = this.perform(otherDisjunctions)
    if (distributedAnswers.length == 0)
      return getAnswers(disjunction).map((answer) =>
        this.buildAccumulatedAnswer(answer),
      )

    return getAnswers(disjunction).reduce(
      (answers: AccumulatedAnswer<T>[], answer) => [
        ...answers,
        ...distributedAnswers.map((accumulatedAnswer) =>
          this.mergeAccumulatedAnswers(accumulatedAnswer, answer),
        ),
      ],
      [],
    )
  }

  private buildAccumulatedAnswer = (
    answer: Answer<T> | AccumulatedAnswer<T>,
  ): AccumulatedAnswer<T> => {
    if (answer instanceof Answer) return new AccumulatedAnswer([answer])
    else return answer
  }

  private mergeAccumulatedAnswers = (
    accumulatedAnswer: AccumulatedAnswer<T>,
    answer: Answer<T> | AccumulatedAnswer<T>,
  ): AccumulatedAnswer<T> => {
    if (answer instanceof Answer)
      return new AccumulatedAnswer([answer, ...accumulatedAnswer.answers])
    else
      return new AccumulatedAnswer([
        ...answer.answers,
        ...accumulatedAnswer.answers,
      ])
  }
}
