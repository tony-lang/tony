import * as AST from '../../ast'
import { AccumulatedAnswer } from './AccumulatedAnswer'
import { AccumulatedDisjunction } from './AccumulatedDisjunction'
import { Answer } from './Answer'
import { Disjunction } from './Disjunction'

export type GeneralizedDisjunction<T extends AST.SyntaxNode> =
  | Disjunction<T>
  | AccumulatedDisjunction<T>

export const getAnswers = <T>(
  disjunction: GeneralizedDisjunction<T>,
): (Answer<T> | AccumulatedAnswer<T>)[] => {
  if (disjunction instanceof Disjunction) return disjunction.answers
  else return disjunction
}
