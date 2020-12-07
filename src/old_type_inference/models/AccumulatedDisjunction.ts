import * as AST from '../../ast'
import { AccumulatedAnswer } from './AccumulatedAnswer'

export type AccumulatedDisjunction<
  T extends AST.SyntaxNode
> = AccumulatedAnswer<T>[]
