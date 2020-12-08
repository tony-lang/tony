import * as AST from '../../ast'
import {
  AccumulatedAnswer,
  AccumulatedDisjunction,
  Answer,
  Disjunction,
} from '../models'

type Factory<T, U, V> = (
  fst: AccumulatedAnswer<T>,
  snd: Answer<U>,
) => Disjunction<V> | Answer<V> | undefined

export class MergeAccumulatedTypeDisjunction<
  T extends AST.SyntaxNode,
  U extends AST.SyntaxNode,
  V extends AST.SyntaxNode
> {
  private _factory: Factory<T, U, V>

  constructor(factory: Factory<T, U, V>) {
    this._factory = factory
  }

  perform = (
    fstDisj: AccumulatedDisjunction<T>,
    sndDisj: Disjunction<U>,
  ): Disjunction<V> =>
    new Disjunction(
      fstDisj.reduce(
        (answers: (Answer<V> | undefined)[], fst) => [
          ...answers,
          ...sndDisj.answers.reduce(this.merge(fst), []),
        ],
        [],
      ),
    )

  private merge = (fst: AccumulatedAnswer<T>) => (
    answers: (Answer<V> | undefined)[],
    snd: Answer<U>,
  ): (Answer<V> | undefined)[] => {
    const merged = this._factory(fst, snd)

    if (merged instanceof Disjunction) return [...answers, ...merged.answers]
    else return [...answers, merged]
  }
}
