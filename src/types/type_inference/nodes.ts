import { ConstrainedType } from './constraints'
import { ResolvedType } from './categories'
import { SyntaxNode } from 'tree-sitter-tony'

// ---- Types ----

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends SyntaxNode> = {
  node: T
  type: ConstrainedType<ResolvedType>
  childNodes: TypedNode<SyntaxNode>[]
}

// ---- Factories ----

export const buildTypedNode = <T extends SyntaxNode>(
  node: T,
  type: ConstrainedType<ResolvedType>,
  childNodes: TypedNode<SyntaxNode>[] = [],
): TypedNode<T> => ({
  node,
  type,
  childNodes,
})
