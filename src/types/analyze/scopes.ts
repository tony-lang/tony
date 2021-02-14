import {
  AbstractionBranchNode,
  BlockNode,
  ClassNode,
  ListComprehensionNode,
  NamedNode,
  ProgramNode,
  RefinementTypeNode,
  SyntaxNode,
  SyntaxType,
  TypeAliasNode,
  WhenNode,
} from 'tree-sitter-tony/tony'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { NonTypeLevelNode, TermLevelNode } from '../nodes'
import {
  TermBinding,
  TypeAssignment,
  TypeBinding,
  TypeVariableBinding,
} from './bindings'
import { AbsolutePath } from '../path'
import { TypedNode } from '../type_inference/nodes'
import { Dependency } from './dependencies'

// ---- Types ----

export type NestingNode =
  | AbstractionBranchNode
  | BlockNode
  | ClassNode
  | ListComprehensionNode
  | RefinementTypeNode
  | TypeAliasNode
  | WhenNode

export type NestingTermLevelNode = NestingNode & TermLevelNode

enum ScopeKind {
  Global,
  File,
  Nested,
  RefinementType,
}

export type ScopeWithTerms = {
  readonly terms: TermBinding[]
}

export type TypingEnvironment = {
  readonly typeAssignments: TypeAssignment[]
}

export type ScopeWithTypes = {
  readonly types: TypeBinding[]
  readonly typeVariables: TypeVariableBinding[]
}

export type ScopeWithErrors = {
  readonly errors: MountedErrorAnnotation[]
}

export type ScopeWithNode<T extends SyntaxNode> = {
  readonly node: T
}

export type TypedScope<T extends NonTypeLevelNode> = {
  readonly typedNode: TypedNode<T>
}

export type RecursiveScope<T> = {
  readonly scopes: T[]
}

export type GlobalScope<
  T extends FileScope | TypedFileScope = FileScope | TypedFileScope
> = RecursiveScope<T> & {
  readonly kind: typeof ScopeKind.Global
  readonly errors: ErrorAnnotation[]
}

export type FileScope<T extends NestingNode = NestingNode> = RecursiveScope<
  NestedScope<T>
> &
  ScopeWithTerms &
  ScopeWithTypes &
  ScopeWithErrors &
  ScopeWithNode<ProgramNode> & {
    readonly kind: typeof ScopeKind.File
    readonly dependency: Dependency
    readonly dependencies: Dependency[]
  }

export type TypedFileScope = FileScope &
  RecursiveScope<TypedNestedScope> &
  TypingEnvironment &
  TypedScope<ProgramNode>

export interface NestedScope<T extends NestingNode = NestingNode>
  extends RecursiveScope<NestedScope<T>>,
    ScopeWithTerms,
    ScopeWithTypes,
    ScopeWithErrors,
    ScopeWithNode<T> {
  readonly kind: typeof ScopeKind.Nested
}

export interface TypedNestedScope<
  T extends NestingTermLevelNode = NestingTermLevelNode
> extends NestedScope<T>,
    TypingEnvironment,
    TypedScope<T> {
  readonly scopes: TypedNestedScope<T>[]
}

// ---- Factories ----

export const buildGlobalScope = <T extends FileScope | TypedFileScope>(
  scopes: T[],
  errors: ErrorAnnotation[] = [],
): GlobalScope<T> => ({
  kind: ScopeKind.Global,
  scopes,
  errors,
})

export const buildFileScope = (
  dependency: Dependency,
  node: ProgramNode,
): FileScope => ({
  kind: ScopeKind.File,
  dependency,
  node,
  scopes: [],
  dependencies: [],
  terms: [],
  types: [],
  typeVariables: [],
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  scopes: TypedNestedScope[],
  typedNode: TypedNode<ProgramNode>,
  typeAssignments: TypeAssignment[],
): TypedFileScope => ({
  ...fileScope,
  scopes,
  typedNode,
  typeAssignments,
})

export const buildNestedScope = (node: NestingNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  terms: [],
  types: [],
  typeVariables: [],
  scopes: [],
  errors: [],
})

export const buildTypedNestedScope = <T extends NestingTermLevelNode>(
  scope: NestedScope<T>,
  scopes: TypedNestedScope<T>[],
  typedNode: TypedNode<T>,
  typeAssignments: TypeAssignment[],
): TypedNestedScope<T> => ({
  ...scope,
  scopes,
  typedNode,
  typeAssignments,
})

export const isFileScope = <T extends FileScope>(
  scope: T | { kind: ScopeKind },
): scope is T => scope.kind === ScopeKind.File

export const isNestingNode = (node: NamedNode): node is NestingNode => {
  switch (node.type) {
    case SyntaxType.AbstractionBranch:
    case SyntaxType.Block:
    case SyntaxType.Class:
    case SyntaxType.ListComprehension:
    case SyntaxType.RefinementType:
    case SyntaxType.TypeAlias:
    case SyntaxType.When:
      return true
    default:
      return false
  }
}
