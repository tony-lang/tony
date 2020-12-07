import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import { InferPatternBindingTypes } from './InferPatternBindingTypes'
import Parser from 'tree-sitter'

export class InferAssignmentType {
  private _inferPatternBindingTypes: InferPatternBindingTypes

  constructor(inferPatternBindingTypes: InferPatternBindingTypes) {
    this._inferPatternBindingTypes = inferPatternBindingTypes
  }

  perform = (
    patternNode: Parser.SyntaxNode,
    value: Disjunction<AST.Expression>,
  ): Disjunction<AST.Assignment> =>
    new Disjunction(
      value.answers.reduce((answers: Answer<AST.Assignment>[], valueAnswer) => {
        const patternAnswers = this._inferPatternBindingTypes
          .perform(patternNode, valueAnswer.typeConstraint)
          ?.answers.map((patternAnswer) =>
            this.buildAnswer(patternAnswer, valueAnswer),
          )

        if (patternAnswers !== undefined) return [...answers, ...patternAnswers]
        else return answers
      }, []),
    )

  private buildAnswer = (
    patternAnswer: Answer<AST.Pattern>,
    valueAnswer: Answer<AST.Expression>,
  ): Answer<AST.Assignment> =>
    new Answer(
      new AST.Assignment(
        patternAnswer.node as AST.AssignablePattern,
        valueAnswer.node,
      ),
      patternAnswer.typeConstraint,
    )
}
