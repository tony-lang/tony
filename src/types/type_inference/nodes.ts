import { IdentifierNode, ShorthandMemberNode } from 'tree-sitter-tony/tony'
import { Constraints } from './constraints'
import { NonTypeLevelNode } from '../nodes'
import { ResolvedType } from './categories'
import { TermBinding } from '../analyze/bindings'

// ---- Types ----

type ExtractKeysOfValueType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never
}[keyof T]
type TypedNodeChildrenWithNever<T extends NonTypeLevelNode> = {
  [P in keyof T]: T[P] extends NonTypeLevelNode
    ? TypedNode<T[P]>
    : T[P] extends NonTypeLevelNode | undefined
    ? TypedNode<T[P] & object> | undefined // NonNullable<T[P]> doesn't work here
    : T[P] extends NonTypeLevelNode[]
    ? TypedNode<T[P][0]>[]
    : never
}
type TypedNodeChildrenNeverKeys<
  T extends NonTypeLevelNode
> = ExtractKeysOfValueType<TypedNodeChildrenWithNever<T>, never | undefined>

/**
 * Type annotations for all node children (that are term nodes).
 */
export type TypedNodeChildren<T extends NonTypeLevelNode> = Omit<
  TypedNodeChildrenWithNever<T>,
  TypedNodeChildrenNeverKeys<T>
>

/**
 * Extensions to the typed node of certain node types.
 */
export type TypedNodeExtensions<T extends NonTypeLevelNode> = T extends
  | IdentifierNode
  | ShorthandMemberNode
  ? { binding: TermBinding }
  : {}

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends NonTypeLevelNode> = TypedNodeChildren<T> &
  TypedNodeExtensions<T> & {
    readonly node: T
    readonly type: ResolvedType
    readonly constraints: Constraints
  }

// ---- Factories ----

export const buildTypedNode = <T extends NonTypeLevelNode>(
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
