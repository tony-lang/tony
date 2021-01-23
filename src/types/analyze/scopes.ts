import {
  AbstractionBranchNode,
  BlockNode,
  InterfaceNode,
  ListComprehensionNode,
  ProgramNode,
  RefinementTypeNode,
  TypeAliasNode,
  WhenNode,
} from 'tree-sitter-tony'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import {
  TermBinding,
  TypeAssignment,
  TypeBinding,
  TypeVariableBinding,
} from './bindings'
import { AbsolutePath } from '../path'
import { TermNode } from '../nodes'
import { TypedNode } from '../type_inference/nodes'

// ---- Types ----

export type NestingNode =
  | AbstractionBranchNode
  | BlockNode
  | InterfaceNode
  | ListComprehensionNode
  | RefinementTypeNode
  | TypeAliasNode
  | WhenNode

export type NestingTermNode = NestingNode & TermNode

enum ScopeKind {
  Global,
  File,
  Nested,
  RefinementType,
}

export type ScopeWithTerms = {
  terms: TermBinding[]
}

export type TypingEnvironment = {
  typeAssignments: TypeAssignment[]
}

export type ScopeWithTypes = {
  types: TypeBinding[]
  typeVariables: TypeVariableBinding[]
}

export type ScopeWithErrors = {
  errors: MountedErrorAnnotation[]
}

export type TypedScope<T extends TermNode> = {
  typedNode: TypedNode<T>
}

export type RecursiveScope<T> = {
  scopes: T[]
}

export type GlobalScope<
  T extends FileScope | TypedFileScope
> = RecursiveScope<T> & {
  kind: typeof ScopeKind.Global
  errors: ErrorAnnotation[]
}

export type FileScope<T extends NestingNode = NestingNode> = RecursiveScope<
  NestedScope<T>
> &
  ScopeWithTerms &
  ScopeWithTypes &
  ScopeWithErrors & {
    kind: typeof ScopeKind.File
    file: AbsolutePath
    node: ProgramNode
    dependencies: AbsolutePath[]
  }

export type TypedFileScope = FileScope &
  RecursiveScope<TypedNestedScope> &
  TypingEnvironment &
  TypedScope<ProgramNode>

export interface NestedScope<T extends NestingNode = NestingNode>
  extends RecursiveScope<NestedScope<T>>,
    ScopeWithTerms,
    ScopeWithTypes,
    ScopeWithErrors {
  kind: typeof ScopeKind.Nested
  node: T
}

export interface TypedNestedScope<T extends NestingTermNode = NestingTermNode>
  extends NestedScope<T>,
    TypingEnvironment,
    TypedScope<T> {
  scopes: TypedNestedScope<T>[]
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
  file: AbsolutePath,
  node: ProgramNode,
): FileScope => ({
  kind: ScopeKind.File,
  file,
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

export const buildTypedNestedScope = <T extends NestingTermNode>(
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
  scope: T | NestedScope,
): scope is T => scope.kind === ScopeKind.File
