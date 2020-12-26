import { Bindings, TypedBindings, initializeBindings } from './bindings'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { AbsolutePath } from '../paths'
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
  bindings: Bindings
}

export interface TypedObjectScope {
  typedBindings: TypedBindings
}

export interface ConcreteScope extends ObjectScope {
  errors: MountedErrorAnnotation[]
}

export interface RecursiveScope<T extends ConcreteScope> {
  scopes: T[]
}

export interface GlobalScope<T extends FileScope | TypedFileScope>
  extends RecursiveScope<T> {
  kind: typeof ScopeKind.Global
  errors: ErrorAnnotation[]
}

export interface FileScope extends RecursiveScope<NestedScope>, ConcreteScope {
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
    ConcreteScope {
  kind: typeof ScopeKind.Nested
  node: SyntaxNode
}

export type Scope = GlobalScope<FileScope> | FileScope | NestedScope

export type TypedScope =
  | GlobalScope<TypedFileScope>
  | TypedFileScope
  | NestedScope

export type ScopeStack<T extends FileScope> = (T | NestedScope)[]

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
  bindings: initializeBindings(node),
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  typedNode: TypedNode<ProgramNode>,
  typedBindings: TypedBindings,
): TypedFileScope => ({
  ...fileScope,
  typedNode,
  typedBindings,
})

export const buildNestedScope = (node: SyntaxNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  bindings: initializeBindings(),
  scopes: [],
  errors: [],
})

export const isFileScope = <T extends FileScope>(
  scope: T | NestedScope,
): scope is T => scope.kind === ScopeKind.File
