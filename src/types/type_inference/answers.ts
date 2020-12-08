import { Node } from '../analyze/ast'
import { ConstrainedType, Type } from './types'

// an answer represents a type annotation for a given node in the syntax tree
export type Answer<T extends Node> = {
  node: T
  type: ConstrainedType<Type>
}

export type Answers<T extends Node> = Answer<T>[]
