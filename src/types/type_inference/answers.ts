import { ConstrainedType, Type } from './types'
import { SyntaxNode } from 'tree-sitter-tony'

// ---- Types ----

/**
 * An answer represents a type annotation for a given node in the syntax tree.
 */
export type Answer<T extends SyntaxNode> = {
  node: T
  type: ConstrainedType<Type>
  childNodes: Answer<SyntaxNode>[]
}

/**
 * Represents a disjunction of possible type annotations. for a given node in
 * the syntax tree.
 */
export type Answers<T extends SyntaxNode> = Answer<T>[]
