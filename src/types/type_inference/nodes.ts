import { Constraints } from './constraints'
import { ResolvedType } from './categories'
import { TermNode } from '../nodes'

// ---- Types ----

type ExtractKeysOfValueType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never
}[keyof T]
type TypedNodeChildrenWithNever<T extends TermNode> = {
  [P in keyof T]: T[P] extends TermNode
    ? TypedNode<T[P]>
    : T[P] extends TermNode[]
    ? TypedNode<T[P][0]>[]
    : never
}
type TypedNodeChildrenNeverKeys<T extends TermNode> = ExtractKeysOfValueType<
  TypedNodeChildrenWithNever<T>,
  never
>

/**
 * Type annotations for all node children (that are term nodes).
 */
export type TypedNodeChildren<T extends TermNode> = Omit<
  TypedNodeChildrenWithNever<T>,
  TypedNodeChildrenNeverKeys<T>
>

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends TermNode> = TypedNodeChildren<T> & {
  node: T
  type: ResolvedType
  constraints: Constraints
}

// ---- Factories ----

export const buildTypedNode = <T extends TermNode>(
  node: T,
  type: ResolvedType,
  constraints: Constraints,
  childNodes: TypedNodeChildren<T>,
): TypedNode<T> => ({
  ...childNodes,
  node,
  type,
  constraints,
})
