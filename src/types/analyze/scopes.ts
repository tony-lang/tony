import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { TermBinding, TypeBinding, TypedTermBinding } from './bindings'
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

export interface ObjectScope {
  bindings: TermBinding[]
}

export interface TypedObjectScope {
  typedBindings: TypedTermBinding[]
}

export interface ScopeWithTypes extends ObjectScope {
  typeBindings: TypeBinding[]
}

export interface ScopeWithErrors {
  errors: MountedErrorAnnotation[]
}

export interface RecursiveScope<T> {
  scopes: T[]
}

export interface GlobalScope<T extends FileScope | TypedFileScope>
  extends RecursiveScope<T> {
  kind: typeof ScopeKind.Global
  errors: ErrorAnnotation[]
}

export interface FileScope
  extends RecursiveScope<NestedScope>,
    ScopeWithTypes,
    ScopeWithErrors {
  kind: typeof ScopeKind.File
  file: AbsolutePath
  node: ProgramNode
  dependencies: AbsolutePath[]
}

export interface TypedFileScope extends FileScope, TypedObjectScope {
  typedNode: TypedNode<ProgramNode>
}

export interface NestedScope
  extends RecursiveScope<NestedScope>,
    ScopeWithTypes,
    ScopeWithErrors {
  kind: typeof ScopeKind.Nested
  node: SyntaxNode
}

export type Scope = GlobalScope<FileScope> | FileScope | NestedScope

export type TypedScope =
  | GlobalScope<TypedFileScope>
  | TypedFileScope
  | NestedScope

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
  bindings: [],
  typeBindings: [],
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  typedNode: TypedNode<ProgramNode>,
  typedBindings: TypedTermBinding[],
): TypedFileScope => ({
  ...fileScope,
  typedNode,
  typedBindings,
})

export const buildNestedScope = (node: SyntaxNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  bindings: [],
  typeBindings: [],
  scopes: [],
  errors: [],
})

export const isFileScope = <T extends FileScope>(
  scope: T | NestedScope,
): scope is T => scope.kind === ScopeKind.File
