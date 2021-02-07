import { IdentifierNode, ShorthandAccessIdentifierNode } from 'tree-sitter-tony'
import { Constraints } from './constraints'
import { NonTypeNode } from '../nodes'
import { ResolvedType } from './categories'
import { TermBinding } from '../analyze/bindings'

// ---- Types ----

type ExtractKeysOfValueType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never
}[keyof T]
type TypedNodeChildrenWithNever<T extends NonTypeNode> = {
  [P in keyof T]: T[P] extends NonTypeNode
    ? TypedNode<T[P]>
    : T[P] extends NonTypeNode | undefined
    ? TypedNode<T[P] & object> | undefined // NonNullable<T[P]> doesn't work here
    : T[P] extends NonTypeNode[]
    ? TypedNode<T[P][0]>[]
    : never
}
type TypedNodeChildrenNeverKeys<T extends NonTypeNode> = ExtractKeysOfValueType<
  TypedNodeChildrenWithNever<T>,
  never | undefined
>

/**
 * Type annotations for all node children (that are term nodes).
 */
export type TypedNodeChildren<T extends NonTypeNode> = Omit<
  TypedNodeChildrenWithNever<T>,
  TypedNodeChildrenNeverKeys<T>
>

/**
 * Extensions to the typed node of certain node types.
 */
export type TypedNodeExtensions<T extends NonTypeNode> = T extends
  | IdentifierNode
  | ShorthandAccessIdentifierNode
  ? { binding: TermBinding }
  : {}

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends NonTypeNode> = TypedNodeChildren<T> &
  TypedNodeExtensions<T> & {
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
  extensions: TypedNodeExtensions<T>,
): TypedNode<T> => ({
  ...childNodes,
  node,
  type,
  constraints,
  ...extensions,
})
