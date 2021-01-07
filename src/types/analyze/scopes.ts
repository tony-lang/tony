import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { ResolvedType, Type } from '../type_inference/types'
import { TermBinding, TypeAssignment, TypeBinding } from './bindings'
import { AbsolutePath } from '../path'
import { ProgramNode } from 'tree-sitter-tony'
import { SyntaxNode } from 'tree-sitter-tony'
import { TypedNode } from '../type_inference/nodes'

// ---- Types ----

enum ScopeKind {
  Global,
  File,
  Nested,
  RefinementType,
}

export type ScopeWithTerms = {
  terms: TermBinding[]
}

export type TypingEnvironment<T extends Type> = {
  typeAssignments: TypeAssignment<T>[]
}

export type ScopeWithTypes = {
  types: TypeBinding[]
}

export type ScopeWithErrors = {
  errors: MountedErrorAnnotation[]
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

export type FileScope = RecursiveScope<NestedScope> &
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
  TypingEnvironment<ResolvedType> & {
    typedNode: TypedNode<ProgramNode>
  }

export interface NestedScope<T extends SyntaxNode = SyntaxNode>
  extends RecursiveScope<NestedScope>,
    ScopeWithTerms,
    ScopeWithTypes,
    ScopeWithErrors {
  kind: typeof ScopeKind.Nested
  node: T
}

export interface TypedNestedScope<T extends SyntaxNode = SyntaxNode>
  extends NestedScope<T>,
    TypingEnvironment<ResolvedType> {
  scopes: TypedNestedScope[]
  typedNode: TypedNode<T>
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
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  scopes: TypedNestedScope[],
  typedNode: TypedNode<ProgramNode>,
  typeAssignments: TypeAssignment<ResolvedType>[],
): TypedFileScope => ({
  ...fileScope,
  scopes,
  typedNode,
  typeAssignments,
})

export const buildNestedScope = (node: SyntaxNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  terms: [],
  types: [],
  scopes: [],
  errors: [],
})

export const buildTypedNestedScope = <T extends SyntaxNode>(
  scope: NestedScope<T>,
  scopes: TypedNestedScope[],
  typedNode: TypedNode<T>,
  typeAssignments: TypeAssignment<ResolvedType>[],
): TypedNestedScope<T> => ({
  ...scope,
  scopes,
  typedNode,
  typeAssignments,
})

export const isFileScope = <T extends FileScope>(
  scope: T | NestedScope,
): scope is T => scope.kind === ScopeKind.File
