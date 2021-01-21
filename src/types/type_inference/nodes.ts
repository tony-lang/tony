import { ResolvedType } from './categories'
import { SyntaxNode } from 'tree-sitter-tony'
import { TypeConstraints } from './constraints'

// ---- Types ----

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends SyntaxNode> = {
  node: T
  type: ResolvedType
  constraints: TypeConstraints
  childNodes: TypedNode<SyntaxNode>[]
}

// ---- Factories ----

export const buildTypedNode = <T extends SyntaxNode>(
  node: T,
  type: ResolvedType,
  constraints: TypeConstraints,
  childNodes: TypedNode<SyntaxNode>[] = [],
): TypedNode<T> => ({
  node,
  type,
  constraints,
  childNodes,
})
