import { Constraints } from './constraints'
import { NonTypeNode } from '../nodes'
import { ResolvedType } from './categories'

// ---- Types ----

type ExtractKeysOfValueType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never
}[keyof T]
type TypedNodeChildrenWithNever<T extends NonTypeNode> = {
  [P in keyof T]: T[P] extends NonTypeNode
    ? TypedNode<T[P]>
    : T[P] extends NonTypeNode[]
    ? TypedNode<T[P][0]>[]
    : never
}
type TypedNodeChildrenNeverKeys<T extends NonTypeNode> = ExtractKeysOfValueType<
  TypedNodeChildrenWithNever<T>,
  never
>

/**
 * Type annotations for all node children (that are term nodes).
 */
export type TypedNodeChildren<T extends NonTypeNode> = Omit<
  TypedNodeChildrenWithNever<T>,
  TypedNodeChildrenNeverKeys<T>
>

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends NonTypeNode> = TypedNodeChildren<T> & {
  readonly kind: T['type']
  readonly node: T
  readonly type: ResolvedType
  readonly constraints: Constraints
}

// ---- Factories ----

export const buildTypedNode = <T extends NonTypeNode>(
  node: T,
  type: ResolvedType,
  constraints: Constraints,
  childNodes: TypedNodeChildren<T>,
): TypedNode<T> => ({
  ...childNodes,
  kind: node.type,
  node,
  type,
  constraints,
})
