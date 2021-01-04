import { ResolvedConstrainedType } from './constraints'
import { SyntaxNode } from 'tree-sitter-tony'

// ---- Types ----

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends SyntaxNode> = {
  node: T
  type: ResolvedConstrainedType
  childNodes: TypedNode<SyntaxNode>[]
}

// ---- Factories ----

export const buildTypedNode = <T extends SyntaxNode>(
  node: T,
  type: ResolvedConstrainedType,
  childNodes: TypedNode<SyntaxNode>[] = [],
): TypedNode<T> => ({
  node,
  type,
  childNodes,
})
