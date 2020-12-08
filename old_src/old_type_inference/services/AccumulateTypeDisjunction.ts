import * as AST from '../../ast'
import {
  AccumulatedAnswer,
  AccumulatedDisjunction,
  Answer,
  Disjunction,
} from '../models'

type Factory<T> = (fst: Answer<T>, snd: Answer<T>) => AccumulatedAnswer<T>

export class AccumulateTypeDisjunction<T extends AST.SyntaxNode> {
  private _factory: Factory<T>

  constructor(factory: Factory<T>) {
    this._factory = factory
  }

  perform = (
    fstDisj: Disjunction<T>,
    sndDisj: Disjunction<T>,
  ): AccumulatedDisjunction<T> =>
    fstDisj.answers.reduce(
      (answers: AccumulatedDisjunction<T>, fst) => [
        ...answers,
        ...sndDisj.answers.reduce(
          (answers: AccumulatedDisjunction<T>, snd) => [
            ...answers,
            this._factory(fst, snd),
          ],
          [],
        ),
      ],
      [],
    )
}
