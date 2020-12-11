import { SyntaxNode } from 'tree-sitter-tony'
import { ConstrainedType, Type } from './types'

// An answer represents a type annotation for a given node in the syntax tree.
export type Answer<T extends SyntaxNode> = {
  node: T
  type: ConstrainedType<Type>
  nestedAnswers: Answers<T>
}

export type Answers<T extends SyntaxNode> = Answer<T>[]
