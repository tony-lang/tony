import * as AST from '../../ast'
import { Answer } from './Answer'
import { TypeError } from '../../errors'
import { isNotUndefined } from '../../utilities'

export class Disjunction<T extends AST.SyntaxNode> {
  private _answers: Answer<T>[]

  constructor(answers: (Answer<T> | undefined)[]) {
    const filteredAnswers = answers.filter(isNotUndefined)
    if (filteredAnswers.length == 0) throw new TypeError()

    this._answers = filteredAnswers
  }

  get answers(): Answer<T>[] {
    return this._answers
  }
}
