import { IdentifierNode, ShorthandMemberNode } from 'tree-sitter-tony/tony'
import { Constraints } from './constraints'
import { NodeWithInferrableType } from '../nodes'
import { ResolvedType } from './categories'
import { TermBinding } from '../analyze/bindings'

// ---- Types ----

type ExtractKeysOfValueType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never
}[keyof T]
type TypedNodeChildrenWithNever<T extends NodeWithInferrableType> = {
  [P in keyof T]: T[P] extends NodeWithInferrableType
    ? TypedNode<T[P]>
    : T[P] extends NodeWithInferrableType | undefined
    ? TypedNode<T[P] & object> | undefined // NonNullable<T[P]> doesn't work here
    : T[P] extends NodeWithInferrableType[]
    ? TypedNode<T[P][0]>[]
    : never
}
type TypedNodeChildrenNeverKeys<T extends NodeWithInferrableType> =
  ExtractKeysOfValueType<TypedNodeChildrenWithNever<T>, never | undefined>

/**
 * Type annotations for all node children (that are term nodes).
 */
export type TypedNodeChildren<T extends NodeWithInferrableType> = Omit<
  TypedNodeChildrenWithNever<T>,
  TypedNodeChildrenNeverKeys<T>
>

/**
 * Extensions to the typed node of certain node types.
 */
export type TypedNodeExtensions<T extends NodeWithInferrableType> = T extends
  | IdentifierNode
  | ShorthandMemberNode
  ? { binding: TermBinding }
  : {}

/**
 * A type annotation for a given node in the syntax tree.
 */
export type TypedNode<T extends NodeWithInferrableType> = TypedNodeChildren<T> &
  TypedNodeExtensions<T> & {
    readonly node: T
    readonly type: ResolvedType
    readonly constraints: Constraints
  }

// ---- Factories ----

export const buildTypedNode = <T extends NodeWithInferrableType>(
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
